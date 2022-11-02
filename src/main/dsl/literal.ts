import { Message, Primitive, TypeConstraintOptions } from '../shared-types';
import { LiteralShape, Shape } from '../shapes';

/**
 * Creates the literal value shape.
 *
 * @param value The literal value to which the value must be equal.
 * @param options The constraint options or an issue message.
 *
 * @template T The type of the literal value.
 */
export function literal<T extends Primitive>(value: T, options?: TypeConstraintOptions | Message): Shape<T> {
  return new LiteralShape(value, options);
}
