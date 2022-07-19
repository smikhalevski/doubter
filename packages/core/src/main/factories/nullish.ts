import { OptionalType, Type } from '../types';
import { nullable } from './nullable';
import { optional } from './optional';

export function nullish<T>(type: Type<T>, defaultValue?: T | null): OptionalType<T | null> {
  return optional(nullable(type), defaultValue);
}
