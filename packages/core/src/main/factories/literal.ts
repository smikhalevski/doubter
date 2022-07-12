import { Primitive } from '../shared-types';
import { LiteralType, Type } from '../types';

export function literal<T extends Primitive>(value: T): Type<T> {
  return new LiteralType(value);
}
