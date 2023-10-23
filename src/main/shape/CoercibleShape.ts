import { coerceToNever, NEVER } from '../coerce/never';
import { TypeArray } from '../Type';
import { Shape } from './Shape';

/**
 * Defines how coercion is applied to input values.
 *
 * - If `coerce` then input values are always coerced;
 * - If `no-coerce` then input values are never coerced;
 * - If `defer` the input values are coerced only if {@link ApplyOptions.coerce} is set to `true`.
 *
 * @group Other
 */
export type CoercionMode = 'coerce' | 'no-coerce' | 'defer';

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
   * The mode in which coercion is applied to input values.
   *
   * @see {@link coerce}
   * @see {@link noCoerce}
   */
  get coercionMode(): CoercionMode {
    return this._tryCoerce === this._coerce ? 'coerce' : this._tryCoerce === coerceToNever ? 'no-coerce' : 'defer';
  }

  /**
   * Enables an input value coercion.
   *
   * @returns The clone of the shape.
   */
  coerce(): this {
    const shape = this._clone();

    shape._tryCoerce = shape._coerce;

    return shape;
  }

  /**
   * Disables an input value coercion, even if {@link ApplyOptions.coerce} is set to `true`.
   *
   * @returns The clone of the shape.
   */
  noCoerce(): this {
    const shape = this._clone();

    shape._tryCoerce = coerceToNever;

    return shape;
  }

  /**
   * Coerces an input value to another type.
   *
   * Override this method along with {@link _getCoercibleInputs} to implement custom type coercion.
   *
   * @param input The input value to coerce.
   * @returns The coerced value, or {@link NEVER} if coercion isn't possible.
   */
  protected _coerce(input: unknown): CoercedValue {
    return NEVER;
  }

  /**
   * Returns the inputs that this shape accepts when coercion is enabled.
   */
  protected _getCoercibleInputs(): TypeArray {
    return this._getInputs();
  }

  /**
   * Conditionally applies coercion to the given value. Call this method in {@link Shape._apply} and
   * {@link Shape._applyAsync} to coerce the input.
   *
   * Override {@link _coerce} and {@link _getCoercibleInputs} methods to implement custom type coercion.
   *
   * @param value The value to coerce.
   * @param force The flag {@link ApplyOptions.coerce}.
   * @returns The coerced value, or {@link NEVER} if coercion isn't possible.
   */
  protected _tryCoerce(value: unknown, force: boolean | undefined): CoercedValue {
    return force !== true ? NEVER : this._coerce(value);
  }
}
