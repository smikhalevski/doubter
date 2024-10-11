import { bigintCoercibleInputs, coerceToBigInt } from '../coerce/bigint';
import { NEVER } from '../coerce/never';
import { CODE_TYPE_BIGINT, MESSAGE_TYPE_BIGINT } from '../constants';
import { Type } from '../Type';
import { IssueOptions, Message, ParseOptions, Result } from '../types';
import { createIssue } from '../utils';
import { Shape } from './Shape';

const bigintInputs = Object.freeze([Type.BIGINT]);

/**
 * The shape of a bigint value.
 *
 * @group Shapes
 */
export class BigIntShape extends Shape<bigint> {
  /**
   * The type issue options or the type issue message.
   */
  protected _options;

  /**
   * Coerces an input value to a bigint.
   *
   * @param input The input value to coerce.
   * @returns The coerced value, or {@link NEVER} if coercion isn't possible.
   */
  protected _applyCoerce?: (input: unknown) => bigint = undefined;

  /**
   * Creates a new {@link BigIntShape} instance.
   *
   * @param options The issue options or the issue message.
   */
  constructor(options?: IssueOptions | Message) {
    super();

    this._options = options;
  }

  /**
   * `true` if this shape coerces input values to the required type during parsing, or `false` otherwise.
   */
  get isCoercing() {
    return this._applyCoerce !== undefined;
  }

  /**
   * Enables an input value coercion.
   *
   * @returns The clone of the shape.
   */
  coerce(): this {
    const shape = this._clone();
    shape._applyCoerce = coerceToBigInt;
    return shape;
  }

  protected _getInputs(): readonly unknown[] {
    return this.isCoercing ? bigintCoercibleInputs : bigintInputs;
  }

  protected _apply(input: any, options: ParseOptions, _nonce: number): Result<bigint> {
    let output = input;

    if (
      typeof output !== 'bigint' &&
      (this._applyCoerce === undefined || (output = this._applyCoerce(input)) === NEVER)
    ) {
      return [createIssue(CODE_TYPE_BIGINT, input, MESSAGE_TYPE_BIGINT, undefined, options, this._options)];
    }
    return this._applyOperations(input, output, options, null) as Result;
  }
}
