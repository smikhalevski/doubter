import { NEVER } from '../coerce/never';
import { CODE_TYPE_PROMISE, MESSAGE_TYPE_PROMISE } from '../constants';
import { isArray } from '../internal/lang';
import { applyShape, INPUT, OUTPUT, Promisify, toDeepPartialShape } from '../internal/shapes';
import { Type } from '../Type';
import { IssueOptions, Message, ParseOptions, Result } from '../types';
import { createIssue } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { AnyShape, DeepPartialProtocol, OptionalDeepPartialShape, unknownInputs } from './Shape';

const promiseInputs = Object.freeze([Type.PROMISE]);

type InferPromise<ValueShape extends AnyShape | null, Leg extends INPUT | OUTPUT> = Promisify<
  ValueShape extends null | undefined ? any : ValueShape extends AnyShape ? ValueShape[Leg] : any
>;

type DeepPartialPromiseShape<ValueShape extends AnyShape | null> = PromiseShape<
  ValueShape extends null | undefined ? null : ValueShape extends AnyShape ? OptionalDeepPartialShape<ValueShape> : null
>;

/**
 * The shape of a {@link !Promise} value.
 *
 * @template ValueShape The shape of the resolved value, or `null` if resolved value shouldn't be parsed.
 * @group Shapes
 */
export class PromiseShape<ValueShape extends AnyShape | null>
  extends CoercibleShape<InferPromise<ValueShape, INPUT>, InferPromise<ValueShape, OUTPUT>, Promise<any>>
  implements DeepPartialProtocol<DeepPartialPromiseShape<ValueShape>>
{
  /**
   * The type issue options or the type issue message.
   */
  protected _options;

  protected _coerce = coerceToPromise;

  /**
   * Creates a new {@link PromiseShape} instance.
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
  }

  deepPartial(): DeepPartialPromiseShape<ValueShape> {
    const valueShape = this.valueShape !== null ? toDeepPartialShape(this.valueShape).optional() : null;

    return new PromiseShape<any>(valueShape, this._options);
  }

  protected _isAsync(): boolean {
    return this.valueShape !== null;
  }

  protected _getInputs(): readonly unknown[] {
    if (!this.isCoercing) {
      return promiseInputs;
    }
    if (this.valueShape === null) {
      return unknownInputs;
    }
    return this.valueShape.inputs.concat(Type.PROMISE);
  }

  protected _apply(input: any, options: ParseOptions, _nonce: number): Result<InferPromise<ValueShape, OUTPUT>> {
    let output = input;

    if (!(input instanceof Promise) && (output = this._applyCoerce(input)) === NEVER) {
      return [createIssue(CODE_TYPE_PROMISE, input, MESSAGE_TYPE_PROMISE, undefined, options, this._options)];
    }
    return this._applyOperations(input, output, options, null) as Result;
  }

  protected _applyAsync(
    input: any,
    options: ParseOptions,
    nonce: number
  ): Promise<Result<InferPromise<ValueShape, OUTPUT>>> {
    let output = input;

    if (!(input instanceof Promise) && (output = this._applyCoerce(input)) === NEVER) {
      return Promise.resolve([
        createIssue(CODE_TYPE_PROMISE, input, MESSAGE_TYPE_PROMISE, undefined, options, this._options),
      ]);
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
}

const coerceToPromise = Promise.resolve.bind(Promise);
