import { booleanCoercibleInputs, coerceToBoolean } from '../coerce/boolean';
import { NEVER } from '../coerce/never';
import { CODE_TYPE_BOOLEAN, MESSAGE_TYPE_BOOLEAN } from '../constants';
import { Type } from '../Type';
import { IssueOptions, Message, ParseOptions, Result } from '../types';
import { createIssue } from '../utils';
import { Shape } from './Shape';

const booleanInputs = Object.freeze([Type.BOOLEAN]);

/**
 * The shape of a boolean value.
 *
 * @group Shapes
 */
export class BooleanShape extends Shape<boolean> {
  /**
   * The type issue options or the type issue message.
   */
  protected _options;

  /**
   * Coerces an input value to a boolean.
   *
   * @param input The input value to coerce.
   * @returns The coerced value, or {@link NEVER} if coercion isn't possible.
   */
  protected _applyCoerce?: (input: unknown) => boolean = undefined;

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
    shape._applyCoerce = coerceToBoolean;
    return shape;
  }

  protected _getInputs(): readonly unknown[] {
    return this.isCoercing ? booleanCoercibleInputs : booleanInputs;
  }

  protected _apply(input: any, options: ParseOptions, _nonce: number): Result<boolean> {
    let output = input;

    if (
      typeof output !== 'boolean' &&
      (this._applyCoerce === undefined || (output = this._applyCoerce(input)) === NEVER)
    ) {
      return [createIssue(CODE_TYPE_BOOLEAN, input, MESSAGE_TYPE_BOOLEAN, undefined, options, this._options)];
    }
    return this._applyOperations(input, output, options, null) as Result;
  }
}
