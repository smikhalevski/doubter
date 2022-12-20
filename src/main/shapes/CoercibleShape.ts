import { Shape } from './Shape';

/**
 * The shape which value can be coerced to a proper type during parsing.
 *
 * @template I The input value.
 * @template O The output value.
 */
export class CoercibleShape<I = any, O = I> extends Shape<I, O> {
  protected _coerced = false;

  /**
   * Enables input value coercion.
   *
   * @returns The clone of the shape.
   */
  coerce(): this {
    const shape = this._clone();
    shape._coerced = true;
    return shape;
  }
}
