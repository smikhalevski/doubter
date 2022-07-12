import { ArrayType, Type } from '../types';

export function array<X extends Type>(elementType: X): ArrayType<X> {
  return new ArrayType(elementType);
}
