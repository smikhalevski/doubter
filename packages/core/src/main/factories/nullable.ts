import { NullableType, Type } from '../types';

export function nullable<T>(type: Type): NullableType<T> {
  return new NullableType(type);
}
