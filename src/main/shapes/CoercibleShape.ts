import { Shape } from './Shape';

/**
 * The shape which value can be coerced to a proper type during parsing.
 *
 * @template I The input value.
 * @template O The output value.
 */
export class CoercibleShape<I = any, O = I> extends Shape<I, O> {
  protected _coerced = false;
  protected _fallbackValue: I | undefined;

  /**
   * Enables input value coercion.
   *
   * @param fallbackValue The value that is used if coercion fails.
   * @template I The input value.
   * @returns The clone of the shape.
   */
  coerce(fallbackValue?: I): this {
    const shape = this._clone();

    shape._coerced = true;
    shape._fallbackValue = fallbackValue;

    return shape;
  }
}
