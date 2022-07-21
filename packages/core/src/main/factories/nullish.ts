import { AnyType, InferType, NullableType, OptionalType } from '../types';
import { nullable } from './nullable';
import { optional } from './optional';

/**
 * Creates the type definition that allows both `undefined` and `null` values.
 *
 * @param type The underlying type definition.
 * @param defaultValue The value that should be used if input is `undefined`.
 */
export function nullish<X extends AnyType>(type: X, defaultValue?: InferType<X> | null): OptionalType<NullableType<X>> {
  return optional(nullable(type), defaultValue);
}
