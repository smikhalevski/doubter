import { AnyType, ArrayType } from '../types';

/**
 * Creates the array type definition that doesn't constrain array elements.
 */
export function array(): ArrayType<any>;

/**
 * Creates the array type definition.
 *
 * @param type The type definition of array elements.
 */
export function array<X extends AnyType>(type: X): ArrayType<X>;

export function array(type?: AnyType): ArrayType<any> {
  return new ArrayType(type || null);
}
