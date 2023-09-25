import { coerceToNever } from '../coerce/coerceToNever';
import { NEVER, Shape } from './Shape';

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
   * Coerces an input value to another type. This is only sed during construction of the new shape instance. Use
   * {@link coerce} without arguments to revert {@link _coerce} to this value.
   *
   * @param value The value to coerce.
   * @returns The coerced value, or {@link NEVER} if coercion isn't possible.
   */
  protected _originalCoerce;

  /**
   * Coerces an input value to another type.
   *
   * @param value The value to coerce.
   * @returns The coerced value, or {@link NEVER} if coercion isn't possible.
   */
  protected _coerce;

  /**
   * `true` if this shapes coerces input values to the required type during parsing, or `false` otherwise.
   */
  isCoercing = false;

  constructor(coerce: (value: unknown) => CoercedValue) {
    super();
    this._originalCoerce = this._coerce = coerce;
  }

  /**
   * Enables an input value coercion.
   *
   * @returns The clone of the shape.
   */
  coerce(): this {
    const shape = this._clone();

    shape.isCoercing = true;
    shape._coerce = this._originalCoerce;

    return shape;
  }

  /**
   * Disables an input value coercion, even if {@link ApplyOptions.coerce} is set to `true`.
   *
   * @returns The clone of the shape.
   */
  noCoerce(): this {
    const shape = this._clone();

    shape.isCoercing = false;
    shape._coerce = coerceToNever;

    return shape;
  }
}
