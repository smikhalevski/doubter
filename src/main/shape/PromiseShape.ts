import { CODE_TYPE, MESSAGE_PROMISE_TYPE } from '../constants';
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
   * @param shape The shape of the resolved value, or `null` if resolved value shouldn't be parsed.
   * @param options The issue options or the issue message.
   * @template ValueShape The shape of the resolved value.
   */
  constructor(readonly shape: ValueShape, options?: IssueOptions | Message) {
    super();

    this._options = options;
    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_PROMISE_TYPE, options, TYPE_PROMISE);
  }

  deepPartial(): DeepPartialPromiseShape<ValueShape> {
    const shape = this.shape !== null ? toDeepPartialShape(this.shape).optional() : null;

    return new PromiseShape<any>(shape, this._options);
  }

  protected _isAsync(): boolean {
    return this.shape !== null;
  }

  protected _getInputs(): unknown[] {
    if (!this.isCoercing) {
      return [TYPE_PROMISE];
    }
    if (this.shape === null) {
      return [TYPE_UNKNOWN];
    }
    return this.shape.inputs.concat(TYPE_PROMISE);
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
      applyShape(this.shape!, value, options, nonce, result => {
        let issues = null;

        if (result !== null) {
          if (isArray(result)) {
            if (!options.verbose || this._operations === null) {
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
