import { IntersectionType, Type } from '../types';

export function and<U extends [Type, ...Type[]]>(...types: U): IntersectionType<U> {
  return new IntersectionType(types);
}
