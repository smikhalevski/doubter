import { AnyType, ArrayType } from '../types';
import { ConstraintOptions } from '../shared-types';

/**
 * Creates the array type definition.
 *
 * @param type The type definition of array elements.
 * @param options The constraint options.
 */
export function array<X extends AnyType>(type: X, options?: ConstraintOptions): ArrayType<X> {
  return new ArrayType(type, options);
}
