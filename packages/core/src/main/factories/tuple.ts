import { TupleType, Type } from '../types';

export function tuple<U extends [Type, ...Type[]]>(elementTypes: U): TupleType<U> {
  return new TupleType(elementTypes);
}
