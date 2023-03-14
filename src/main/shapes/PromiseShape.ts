import { CODE_TYPE, ERROR_REQUIRES_ASYNC, MESSAGE_PROMISE_TYPE } from '../constants';
import { TYPE_PROMISE } from '../Type';
import { ApplyOptions, ConstraintOptions, Message } from '../types';
import { applyShape, copyUnsafeChecks, createIssueFactory, isArray, ok, toDeepPartialShape } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { AnyShape, DeepPartialProtocol, OptionalDeepPartialShape, Result } from './Shape';

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

  protected _getInputs(): unknown[] {
    if (this.isCoerced) {
      return this.shape.inputs.concat(TYPE_PROMISE);
    } else {
      return [TYPE_PROMISE];
    }
  }

  protected _apply(input: unknown, options: ApplyOptions): Result<Promise<S['output']>> {
    throw new Error(ERROR_REQUIRES_ASYNC);
  }

  protected _applyAsync(input: any, options: ApplyOptions): Promise<Result<Promise<S['output']>>> {
    if (!(input instanceof Promise) && !(options.coerced || this.isCoerced)) {
      return Promise.resolve(this._typeIssueFactory(input, options));
    }

    const handleValue = (value: unknown) => {
      return applyShape(this.shape, value, options, result => {
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
