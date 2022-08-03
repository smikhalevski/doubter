import { AnyType, UnionType } from '../types';
import { Several } from '../shared-types';

/**
 * Creates a union type definition that tries to parse the input with one of the provided types.
 *
 * @param types The list of types to try.
 */
export function or<U extends Several<AnyType>>(types: U): UnionType<U> {
  return new UnionType(types);
}
