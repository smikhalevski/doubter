import { AnyType, TupleType } from '../types';
import { Several } from '../shared-types';

/**
 * Creates the tuple type definition.
 *
 * @param types The list of tuple elements.
 */
export function tuple<U extends Several<AnyType>>(types: U): TupleType<U> {
  return new TupleType(types);
}
