import { NEVER } from '../coerce/never';
import { coerceToNumber, numberCoercibleInputs } from '../coerce/number';
import { CODE_TYPE_NUMBER, MESSAGE_TYPE_NUMBER } from '../constants';
import { Type } from '../Type';
import { Any, IssueOptions, Message, ParseOptions, Result } from '../types';
import { createIssue } from '../utils';
import { AllowShape, ReplaceShape, Shape } from './Shape';

const numberInputs = Object.freeze<unknown[]>([Type.NUMBER]);

/**
 * The shape of a number value.
 *
 * @group Shapes
 */
export class NumberShape extends Shape<number> {
  /**
   * `true` if this shape coerces input values to the required type during parsing, or `false` otherwise.
   */
  isCoercing = false;

  /**
   * The type issue options or the type issue message.
   */
  protected _options;

  /**
   * Creates a new {@link NumberShape} instance.
   *
   * @param options The issue options or the issue message.
   */
  constructor(options?: IssueOptions | Message) {
    super();

    this._options = options;
  }

  /**
   * Allows `NaN` as an input and output value.
   */
  nan(): AllowShape<this, number>;

  /**
   * Replaces an input `NaN` value with a default output value.
   *
   * @param defaultValue The value that is used instead of `NaN` in the output.
   */
  nan<T extends Any>(defaultValue: T): ReplaceShape<this, number, T>;

  nan(defaultValue?: any) {
    return this.replace(NaN, arguments.length === 0 ? NaN : defaultValue);
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
    return this.isCoercing ? numberCoercibleInputs : numberInputs;
  }

  protected _apply(input: any, options: ParseOptions, _nonce: number): Result<number> {
    let output = input;

    if (
      (typeof output !== 'number' || output !== output) &&
      (!this.isCoercing || (output = coerceToNumber(input)) === NEVER)
    ) {
      return [createIssue(CODE_TYPE_NUMBER, input, MESSAGE_TYPE_NUMBER, undefined, options, this._options)];
    }
    return this._applyOperations(input, output, options, null) as Result;
  }
}
