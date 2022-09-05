import { AnyType, InferType, OptionalType } from '../types';

/**
 * Marks the type as optional.
 *
 * @param type The type that must be optional.
 * @param defaultValue The value that should be used if input is `undefined`.
 */
export function optional<X extends AnyType>(type: X, defaultValue?: InferType<X>['output']): OptionalType<X> {
  return new OptionalType(type, defaultValue);
}
