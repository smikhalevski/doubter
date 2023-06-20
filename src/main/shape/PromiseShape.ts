import { CODE_TYPE, ERROR_REQUIRES_ASYNC, MESSAGE_PROMISE_TYPE } from '../constants';
import { applyShape, copyUnsafeChecks, isArray, ok, toDeepPartialShape } from '../internal';
import { TYPE_PROMISE } from '../Type';
import { ApplyOptions, ConstraintOptions, Message } from '../types';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { AnyShape, DeepPartialProtocol, INPUT, NEVER, OptionalDeepPartialShape, OUTPUT, Result } from './Shape';

/**
 * The shape of a `Promise` value.
 *
 * @template ValueShape The shape of the resolved value.
 */
export class PromiseShape<ValueShape extends AnyShape>
  extends CoercibleShape<Promise<ValueShape[INPUT]>, Promise<ValueShape[OUTPUT]>>
  implements DeepPartialProtocol<PromiseShape<OptionalDeepPartialShape<ValueShape>>>
{
  /**
   * The type constraint options or the type issue message.
   */
  protected _options;

  /**
   * Returns issues associated with an invalid input value type.
   */
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode PromiseShape} instance.
   *
   * @param shape The shape of the resolved value.
   * @param options The type constraint options or the type issue message.
   * @template ValueShape The shape of the resolved value.
   */
  constructor(readonly shape: ValueShape, options?: ConstraintOptions | Message) {
    super();

    this._options = options;
    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_PROMISE_TYPE, options, TYPE_PROMISE);
  }

  deepPartial(): PromiseShape<OptionalDeepPartialShape<ValueShape>> {
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

  protected _apply(input: unknown, options: ApplyOptions, nonce: number): Result<Promise<ValueShape[OUTPUT]>> {
    throw new Error(ERROR_REQUIRES_ASYNC);
  }

  protected _applyAsync(
    input: any,
    options: ApplyOptions,
    nonce: number
  ): Promise<Result<Promise<ValueShape[OUTPUT]>>> {
    let output = input;

    if (
      !(input instanceof Promise) &&
      (!(options.coerced || this.isCoerced) || (output = this._coerce(input)) === NEVER)
    ) {
      return Promise.resolve(this._typeIssueFactory(input, options));
    }

    return output.then((value: unknown) =>
      applyShape(this.shape, value, options, nonce, result => {
        const { _applyChecks } = this;

        let issues = null;

        if (result !== null) {
          if (isArray(result)) {
            if (!options.verbose || !this._isUnsafe) {
              return result;
            }
            issues = result;
          } else {
            output = Promise.resolve(result.value);
          }
        }

        if ((_applyChecks === null || (issues = _applyChecks(output, issues, options)) === null) && output !== input) {
          return ok(output);
        }
        return issues;
      })
    );
  }

  protected _coerce(value: unknown): Promise<ValueShape[INPUT]> {
    return Promise.resolve(value);
  }
}
