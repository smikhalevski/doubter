import { Shape } from './Shape';

/**
 * The shape can coerce input value type during parsing.
 *
 * @template InputValue The input value.
 * @template OutputValue The output value.
 * @template CoercedValue The value to which an input is coerced.
 * @group Shapes
 */
export abstract class CoercibleShape<
  InputValue = any,
  OutputValue = InputValue,
  CoercedValue = InputValue
> extends Shape<InputValue, OutputValue> {
  /**
   * `true` if this shapes coerces input values to the required type during parsing, or `false` otherwise.
   */
  isCoercing = false;

  /**
   * Enables an input value coercion.
   *
   * @param cb The callback that overrides the built-in coercion.
   * @returns The clone of the shape.
   */
  coerce(
    /**
     * @param value The value to coerce.
     * @returns The coerced value, or {@linkcode NEVER} if coercion isn't possible.
     */
    cb?: (value: unknown) => CoercedValue
  ): this {
    const shape = this._clone();

    shape.isCoercing = true;

    if (cb !== undefined) {
      shape._coerce = cb;
    }
    return shape;
  }

  /**
   * Coerces an input value to another type.
   *
   * @param value The value to coerce.
   * @returns The coerced value, or {@linkcode NEVER} if coercion isn't possible.
   */
  protected abstract _coerce(value: unknown): CoercedValue;
}
