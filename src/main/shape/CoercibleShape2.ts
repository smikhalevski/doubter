import { coerceToNever, NEVER } from '../coerce/never';
import { Shape } from './Shape';

export type CoercionMode = 'coerce' | 'no-coerce' | 'deferred';

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
   * Coerces an input value to another type.
   *
   * Override this method along with {@link Shape._getInputs} to implement custom type coercion.
   *
   * @param value The value to coerce.
   * @returns The coerced value, or {@link NEVER} if coercion isn't possible.
   */
  protected _coerce;

  /**
   * Conditionally applies coercion to the given value.
   *
   * @param value The value to coerce.
   * @param force The flag {@link ApplyOptions.coerce}.
   * @returns The coerced value, or {@link NEVER} if coercion isn't possible.
   */
  protected _tryCoerce: (value: unknown, force: boolean | undefined) => CoercedValue;

  constructor(cb: (value: unknown) => CoercedValue) {
    super();

    this._coerce = cb;
    this._tryCoerce = (value, force) => (force !== true ? NEVER : cb(value));
  }

  get coercionMode(): CoercionMode {
    return this._tryCoerce === this._coerce ? 'coerce' : this._tryCoerce === coerceToNever ? 'no-coerce' : 'deferred';
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

  protected _getCoercibleInputs(): readonly unknown[] {
    return this._getInputs();
  }
}
