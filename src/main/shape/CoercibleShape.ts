import { coerceToNever, NEVER } from '../coerce/never';
import { Shape } from './Shape';

/**
 * The shape that can coerce input value type during parsing.
 *
 * @template InputValue The input value.
 * @template OutputValue The output value.
 * @template CoercedValue The value to which an input is coerced.
 * @group Shapes
 */
export class CoercibleShape<InputValue = any, OutputValue = InputValue, CoercedValue = InputValue> extends Shape<
  InputValue,
  OutputValue
> {
  /**
   * `true` if this shapes coerces input values to the required type during parsing, or `false` otherwise.
   */
  get isCoercing() {
    return this._applyCoerce !== coerceToNever;
  }

  /**
   * Applies coercion rules to the given value. Call this method in {@link Shape._apply} and {@link Shape._applyAsync}
   * to coerce the input.
   *
   * Override {@link CoercibleShape._coerce} and {@link Shape._getInputs} methods to implement custom type coercion.
   *
   * @param input The input value to coerce.
   * @returns The coerced value, or {@link NEVER} if coercion isn't possible.
   */
  protected _applyCoerce: (input: unknown) => CoercedValue = coerceToNever;

  /**
   * Enables an input value coercion.
   *
   * @returns The clone of the shape.
   */
  coerce(): this {
    const shape = this._clone();
    shape._applyCoerce = this._coerce;
    return shape;
  }

  /**
   * Coerces an input value to another type.
   *
   * Override this method along with {@link Shape._getInputs} to implement custom type coercion.
   *
   * @param input The input value to coerce.
   * @returns The coerced value, or {@link NEVER} if coercion isn't possible.
   */
  protected _coerce(input: unknown): CoercedValue {
    return NEVER;
  }
}
