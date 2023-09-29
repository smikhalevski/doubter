import { coerceToNever, NEVER } from '../coerce/never';
import { Shape } from './Shape';

/**
 * The shape can coerce input value type during parsing.
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
    return this._applyCoercion === this._coerce;
  }

  /**
   * Enables an input value coercion.
   *
   * @returns The clone of the shape.
   */
  coerce(): this {
    const shape = this._clone();

    shape._applyCoercion = this._coerce;

    return shape;
  }

  /**
   * Disables an input value coercion, even if {@link ApplyOptions.coerce} is set to `true`.
   *
   * @returns The clone of the shape.
   */
  noCoerce(): this {
    const shape = this._clone();

    shape._applyCoercion = coerceToNever;

    return shape;
  }

  /**
   * Coerces an input value to another type.
   *
   * Override this method along with {@link Shape._getInputs} to implement custom type coercion.
   *
   * @param value The value to coerce.
   * @returns The coerced value, or {@link NEVER} if coercion isn't possible.
   */
  protected _coerce(value: unknown): CoercedValue {
    return NEVER;
  }

  /**
   * Conditionally applies coercion to the given value. To implement coercion mechanism override {@link _coerce} method.
   *
   * @param value The value to coerce.
   * @param force The flag {@link ApplyOptions.coerce}.
   * @returns The coerced value, or {@link NEVER} if coercion isn't possible.
   */
  protected _applyCoercion(value: unknown, force?: boolean): CoercedValue {
    return force !== true ? NEVER : this._coerce(value);
  }
}
