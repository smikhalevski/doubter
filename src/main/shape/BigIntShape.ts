import { bigintCoercibleInputs, coerceToBigInt } from '../coerce/bigint.ts';
import { NEVER } from '../coerce/never.ts';
import { CODE_TYPE_BIGINT, MESSAGE_TYPE_BIGINT } from '../constants.ts';
import { Type } from '../Type.ts';
import { IssueOptions, Message, ParseOptions, Result } from '../types.ts';
import { createIssue } from '../utils.ts';
import { Shape } from './Shape.ts';

const bigintInputs = Object.freeze<unknown[]>([Type.BIGINT]);

/**
 * The shape of a bigint value.
 *
 * @group Shapes
 */
export class BigIntShape extends Shape<bigint> {
  /**
   * `true` if this shape coerces input values to the required type during parsing, or `false` otherwise.
   */
  isCoercing = false;

  /**
   * The type issue options or the type issue message.
   */
  protected _options;

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
   * Enables an input value coercion.
   *
   * @returns The clone of the shape.
   */
  coerce(): this {
    const shape = this._clone();
    shape.isCoercing = true;
    return shape;
  }

  protected _getInputs(): readonly unknown[] {
    return this.isCoercing ? bigintCoercibleInputs : bigintInputs;
  }

  protected _apply(input: any, options: ParseOptions, _nonce: number): Result<bigint> {
    let output = input;

    if (typeof output !== 'bigint' && (!this.isCoercing || (output = coerceToBigInt(input)) === NEVER)) {
      return [createIssue(CODE_TYPE_BIGINT, input, MESSAGE_TYPE_BIGINT, undefined, options, this._options)];
    }
    return this._applyOperations(input, output, options, null) as Result;
  }
}
