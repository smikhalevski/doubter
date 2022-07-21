import { Dict } from '../shared-types';
import { AnyType, ObjectType, Type } from '../types';

/**
 * Creates the array type definition.
 *
 * @param props The mapping from an object key to a corresponding type definition.
 */
export function object<P extends Dict<AnyType>>(props: P): ObjectType<P, Type<never>> {
  return new ObjectType<P, Type<never>>(props, null);
}
