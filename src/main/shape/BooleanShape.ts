import { booleanCoercibleInputs, coerceToBoolean } from '../coerce/boolean.ts';
import { NEVER } from '../coerce/never.ts';
import { CODE_TYPE_BOOLEAN, MESSAGE_TYPE_BOOLEAN } from '../constants.ts';
import { Type } from '../Type.ts';
import { IssueOptions, Message, ParseOptions, Result } from '../types.ts';
import { createIssue } from '../utils.ts';
import { Shape } from './Shape.ts';

const booleanInputs = Object.freeze<unknown[]>([Type.BOOLEAN]);

/**
 * The shape of a boolean value.
 *
 * @group Shapes
 */
export class BooleanShape extends Shape<boolean> {
  /**
   * `true` if this shape coerces input values to the required type during parsing, or `false` otherwise.
   */
  isCoercing = false;

  /**
   * The type issue options or the type issue message.
   */
  protected _options;

  /**
   * Creates a new {@link BooleanShape} instance.
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
    return this.isCoercing ? booleanCoercibleInputs : booleanInputs;
  }

  protected _apply(input: any, options: ParseOptions, _nonce: number): Result<boolean> {
    let output = input;

    if (typeof output !== 'boolean' && (!this.isCoercing || (output = coerceToBoolean(input)) === NEVER)) {
      return [createIssue(CODE_TYPE_BOOLEAN, input, MESSAGE_TYPE_BOOLEAN, undefined, options, this._options)];
    }
    return this._applyOperations(input, output, options, null) as Result;
  }
}
