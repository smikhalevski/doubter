import { AnyType, NullableType } from '../types';

/**
 * Creates the nullable type definition.
 *
 * @param type The underlying type definition.
 */
export function nullable<X extends AnyType>(type: X): NullableType<X> {
  return new NullableType(type);
}
