import { AnyType, TupleType } from '../types';
import { ConstraintOptions, Several } from '../shared-types';

/**
 * Creates the tuple type definition.
 *
 * @param types The list of tuple elements.
 * @param options
 */
export function tuple<U extends Several<AnyType>>(types: U, options?: ConstraintOptions): TupleType<U> {
  return new TupleType(types, options);
}
