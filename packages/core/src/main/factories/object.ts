import { Dict } from '../shared-types';
import { ObjectType, Type } from '../types';

export function object<P extends Dict<Type>>(props: P): ObjectType<P> {
  return new ObjectType(props);
}
