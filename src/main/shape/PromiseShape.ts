import { CODE_TYPE, MESSAGE_TYPE_PROMISE } from '../constants';
import { applyShape, INPUT, isArray, OUTPUT, Promisify, toDeepPartialShape } from '../internal';
import { TYPE_PROMISE, TYPE_UNKNOWN } from '../Type';
import { ApplyOptions, IssueOptions, Message, Result } from '../types';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { AnyShape, DeepPartialProtocol, NEVER, OptionalDeepPartialShape } from './Shape';

type InferPromise<ValueShape extends AnyShape | null, Leg extends INPUT | OUTPUT> = Promisify<
  ValueShape extends null | undefined ? any : ValueShape extends AnyShape ? ValueShape[Leg] : any
>;

type DeepPartialPromiseShape<ValueShape extends AnyShape | null> = PromiseShape<
  ValueShape extends null | undefined ? null : ValueShape extends AnyShape ? OptionalDeepPartialShape<ValueShape> : null
>;

/**
 * The shape of a `Promise` value.
 *
 * @template ValueShape The shape of the resolved value, or `null` if resolved value shouldn't be parsed.
 * @group Shapes
 */
export class PromiseShape<ValueShape extends AnyShape | null>
  extends CoercibleShape<InferPromise<ValueShape, INPUT>, InferPromise<ValueShape, OUTPUT>, Promise<any>>
  implements DeepPartialProtocol<DeepPartialPromiseShape<ValueShape>>
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
   * @param valueShape The shape of the resolved value, or `null` if resolved value shouldn't be parsed.
   * @param options The issue options or the issue message.
   * @template ValueShape The shape of the resolved value.
   */
  constructor(
    readonly valueShape: ValueShape,
    options?: IssueOptions | Message
  ) {
    super();

    this._options = options;
    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_TYPE_PROMISE, options, TYPE_PROMISE);
  }

  deepPartial(): DeepPartialPromiseShape<ValueShape> {
    const valueShape = this.valueShape !== null ? toDeepPartialShape(this.valueShape).optional() : null;

    return new PromiseShape<any>(valueShape, this._options);
  }

  protected _isAsync(): boolean {
    return this.valueShape !== null;
  }

  protected _getInputs(): unknown[] {
    if (!this.isCoercing) {
      return [TYPE_PROMISE];
    }
    if (this.valueShape === null) {
      return [TYPE_UNKNOWN];
    }
    return this.valueShape.inputs.concat(TYPE_PROMISE);
  }

  protected _apply(input: any, options: ApplyOptions, nonce: number): Result<InferPromise<ValueShape, OUTPUT>> {
    let output = input;

    if (
      !(input instanceof Promise) &&
      (!(options.coerce || this.isCoercing) || (output = this._coerce(input)) === NEVER)
    ) {
      return [this._typeIssueFactory(input, options)];
    }
    return this._applyOperations(input, output, options, null);
  }

  protected _applyAsync(
    input: any,
    options: ApplyOptions,
    nonce: number
  ): Promise<Result<InferPromise<ValueShape, OUTPUT>>> {
    let output = input;

    if (
      !(input instanceof Promise) &&
      (!(options.coerce || this.isCoercing) || (output = this._coerce(input)) === NEVER)
    ) {
      return Promise.resolve([this._typeIssueFactory(input, options)]);
    }

    return output.then((value: unknown) =>
      applyShape(this.valueShape!, value, options, nonce, result => {
        let issues = null;

        if (result !== null) {
          if (isArray(result)) {
            if (options.earlyReturn || this.operations.length === 0) {
              return result;
            }
            issues = result;
          } else {
            output = Promise.resolve(result.value);
          }
        }
        return this._applyOperations(input, output, options, issues);
      })
    );
  }

  protected _coerce(value: unknown): Promise<any> {
    return Promise.resolve(value);
  }
}
