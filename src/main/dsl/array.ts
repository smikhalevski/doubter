import { AnyType, ArrayType } from '../types';

/**
 * Creates the array type definition.
 *
 * @param type The type definition of array elements.
 */
export function array<X extends AnyType>(type: X): ArrayType<X> {
  return new ArrayType(type);
}
