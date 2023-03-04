import { AnyShape, DeepPartialProtocol, OptionalDeepPartialShape, Result, ValueType } from './Shape';
import { ApplyOptions, ConstraintOptions, Message } from '../shared-types';
import { applyForResult, copyUnsafeChecks, createIssueFactory, isArray, ok, toDeepPartialShape } from '../utils';
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

  protected _apply(input: unknown, options: ApplyOptions): Result<Promise<S['output']>> {
    throw new Error(ERROR_REQUIRES_ASYNC);
  }

  protected _applyAsync(input: any, options: ApplyOptions): Promise<Result<Promise<S['output']>>> {
    if (!(input instanceof Promise) && !(options.coerced || this.isCoerced)) {
      return Promise.resolve(this._typeIssueFactory(input, options));
    }

    const handleValue = (value: unknown) => {
      return applyForResult(this.shape, value, options, result => {
        const { _applyChecks } = this;

        let output = input;
        let issues = null;

        if (result !== null) {
          if (isArray(result)) {
            if (!options.verbose || !this._isUnsafe) {
              return result;
            }
            issues = result;
          } else {
            output = result.value;
          }
        }

        output = Promise.resolve(output);

        if ((_applyChecks === null || (issues = _applyChecks(output, issues, options)) === null) && output !== input) {
          return ok(output);
        }
        return issues;
      });
    };

    if (input instanceof Promise) {
      return input.then(handleValue);
    }
    return Promise.resolve(handleValue(input));
  }
}
