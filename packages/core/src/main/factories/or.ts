import { Type, UnionType } from '../types';

export function or<U extends [Type, ...Type[]]>(...types: U): UnionType<U> {
  return new UnionType(types);
}
