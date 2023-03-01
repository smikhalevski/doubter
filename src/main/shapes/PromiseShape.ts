import { AnyShape, DeepPartialProtocol, OptionalDeepPartialShape, Result, ValueType } from './Shape';
import { ConstraintOptions, Message, ParseOptions } from '../shared-types';
import {
  applyForResult,
  copyUnsafeChecks,
  createIssueFactory,
  isArray,
  isEqual,
  ok,
  toDeepPartialShape,
} from '../utils';
import { CODE_TYPE, ERROR_REQUIRES_ASYNC, MESSAGE_PROMISE_TYPE, TYPE_OBJECT, TYPE_PROMISE } from '../constants';
import { CoercibleShape } from './CoercibleShape';

/**
 * The shape of a value wrapped in a `Promise` instance.
 *
 * @template S The shape of the resolved value.
 */
export class PromiseShape<S extends AnyShape>
  extends CoercibleShape<Promise<S['input']>, Promise<S['output']>>
  implements DeepPartialProtocol<PromiseShape<OptionalDeepPartialShape<S>>>
{
  protected _options;
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

    this._options = options;
    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_PROMISE_TYPE, options, TYPE_PROMISE);
  }

  deepPartial(): PromiseShape<OptionalDeepPartialShape<S>> {
    return copyUnsafeChecks(this, new PromiseShape<any>(toDeepPartialShape(this.shape).optional(), this._options));
  }

  protected _isAsync(): boolean {
    return true;
  }

  protected _getInputTypes(): readonly ValueType[] {
    return [TYPE_OBJECT];
  }

  protected _apply(input: unknown, options: ParseOptions): Result<Promise<S['output']>> {
    throw new Error(ERROR_REQUIRES_ASYNC);
  }

  protected _applyAsync(input: any, options: ParseOptions): Promise<Result<Promise<S['output']>>> {
    let output = input;

    if (!(input instanceof Promise)) {
      if (!(options.coerced || this.isCoerced)) {
        return Promise.resolve(this._typeIssueFactory(input, options));
      }
      output = Promise.resolve(input);
    }

    const { _applyChecks } = this;

    return output.then((value: unknown) =>
      applyForResult(this.shape, value, options, result => {
        let issues = null;

        if (result !== null) {
          if (isArray(result)) {
            if (!options.verbose || !this._isUnsafe) {
              return result;
            }
            issues = result;
          } else if (!isEqual(value, result.value)) {
            output = Promise.resolve(result.value);
          }
        }

        if (_applyChecks === null || (issues = _applyChecks(output, issues, options)) === null) {
          return ok(output);
        }
        return issues;
      })
    );
  }
}
