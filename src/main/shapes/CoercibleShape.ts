import { Shape } from './Shape';

/**
 * The shape can coerce input value type during parsing.
 *
 * @template InputValue The input value.
 * @template OutputValue The output value.
 */
export class CoercibleShape<InputValue = any, OutputValue = InputValue> extends Shape<InputValue, OutputValue> {
  /**
   * `true` if input value is coerced to the required type during parsing, or `false` otherwise.
   */
  isCoerced = false;

  /**
   * Enables an input value coercion.
   *
   * @returns The clone of the shape.
   */
  coerce(): this {
    const shape = this._clone();
    shape.isCoerced = true;
    return shape;
  }
}
