import { AnyShape, ValueType } from './Shape';
import { ApplyResult, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { createIssueFactory, isArray, isEqual, objectTypes, ok } from '../utils';
import { CODE_TYPE, ERROR_REQUIRES_ASYNC, MESSAGE_PROMISE_TYPE, TYPE_PROMISE } from '../constants';
import { CoercibleShape } from './CoercibleShape';

/**
 * The shape of a value wrapped in a `Promise` instance.
 *
 * @template S The shape of the resolved value.
 */
export class PromiseShape<S extends AnyShape> extends CoercibleShape<Promise<S['input']>, Promise<S['output']>> {
  protected _issueFactory;

  /**
   * Creates a new {@linkcode PromiseShape} instance.
   *
   * @param shape The shape of the resolved value.
   * @param options The type constraint options or the type issue message.
   * @template S The shape of the resolved value.
   */
  constructor(readonly shape: S, options?: TypeConstraintOptions | Message) {
    super();

    this._issueFactory = createIssueFactory(CODE_TYPE, MESSAGE_PROMISE_TYPE, options, TYPE_PROMISE);
  }

  protected _checkAsync(): boolean {
    return true;
  }

  protected _getInputTypes(): ValueType[] {
    return objectTypes;
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<Promise<S['output']>> {
    throw new Error(ERROR_REQUIRES_ASYNC);
  }

  protected _applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<Promise<S['output']>>> {
    let output = input as Promise<unknown>;

    if (!(output instanceof Promise)) {
      if (!options.coerced && !this._coerced) {
        return Promise.resolve(this._issueFactory(input, options));
      }
      output = Promise.resolve(input);
    }

    const { _applyChecks } = this;

    let inputValue: unknown;
    let outputValue: unknown;

    return output
      .then(value => {
        inputValue = outputValue = value;
        return this.shape['_applyAsync'](value, options);
      })
      .then(result => {
        let issues;

        if (result !== null) {
          if (isArray(result)) {
            return result;
          }
          outputValue = result.value;

          if (!isEqual(inputValue, outputValue)) {
            output = Promise.resolve(outputValue);
          }
        }

        if (_applyChecks !== null) {
          issues = _applyChecks(output, null, options);

          if (issues !== null) {
            return issues;
          }
        }
        return ok(output);
      });
  }
}
