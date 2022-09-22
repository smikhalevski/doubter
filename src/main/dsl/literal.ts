import { InputConstraintOptions, Primitive } from '../shared-types';
import { LiteralShape, Shape } from '../shapes';

/**
 * Creates the literal value shape.
 *
 * @param value The literal value to which the value must be equal.
 * @param options The constraint options.
 *
 * @template T The type of the literal value.
 */
export function literal<T extends Primitive>(value: T, options?: InputConstraintOptions): Shape<T> {
  return new LiteralShape(value, options);
}
