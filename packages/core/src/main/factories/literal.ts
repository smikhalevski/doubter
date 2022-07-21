import { Primitive } from '../shared-types';
import { LiteralType, Type } from '../types';

/**
 * Creates the literal value type definition.
 *
 * @param value The literal value to which the value must be equal.
 *
 * @template T The type of the literal value.
 */
export function literal<T extends Primitive>(value: T): Type<T> {
  return new LiteralType(value);
}
