import { AnyShape, ApplyResult, ValueType } from './Shape';
import { ConstraintOptions, Message, ParseOptions } from '../shared-types';
import { createIssueFactory, isArray, isEqual, ok } from '../utils';
import { CODE_TYPE, ERROR_REQUIRES_ASYNC, MESSAGE_PROMISE_TYPE, TYPE_OBJECT, TYPE_PROMISE } from '../constants';
import { CoercibleShape } from './CoercibleShape';

/**
 * The shape of a value wrapped in a `Promise` instance.
 *
 * @template S The shape of the resolved value.
 */
export class PromiseShape<S extends AnyShape> extends CoercibleShape<Promise<S['input']>, Promise<S['output']>> {
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode PromiseShape} instance.
   *
   * @param shape The shape of the resolved value.
   * @param options The type constraint options or the type issue message.
   * @template S The shape of the resolved value.
   */
  constructor(readonly shape: S, options?: ConstraintOptions | Message) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_PROMISE_TYPE, options, TYPE_PROMISE);
  }

  protected _requiresAsync(): boolean {
    return true;
  }

  protected _getInputTypes(): ValueType[] {
    return [TYPE_OBJECT];
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<Promise<S['output']>> {
    throw new Error(ERROR_REQUIRES_ASYNC);
  }

  protected _applyAsync(input: any, options: ParseOptions): Promise<ApplyResult<Promise<S['output']>>> {
    let output: Promise<unknown> = input;

    if (!(output instanceof Promise)) {
      if (!(options.coerced || this._coerced)) {
        return Promise.resolve(this._typeIssueFactory(input, options));
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

        if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
          return ok(output);
        }
        return issues;
      });
  }
}
