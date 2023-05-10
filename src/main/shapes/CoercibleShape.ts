import { Shape } from './Shape';

/**
 * The shape which value can be coerced to a proper type during parsing.
 *
 * @template I The input value.
 * @template O The output value.
 */
export class CoercibleShape<I = any, O = I> extends Shape<I, O> {
  /**
   * `true` if input value is coerced to required type during parsing, or `false` otherwise.
   */
  isCoerced = false;

  /**
   * Enables input value coercion.
   *
   * @returns The clone of the shape, or this shape if it is already coerced.
   */
  coerce(): this {
    const shape = this._clone();
    shape.isCoerced = true;
    return shape;
  }
}
