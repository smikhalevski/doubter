import { OptionalType, Type } from '../types';

/**
 * Marks the type as optional.
 *
 * @param type The type that must be optional.
 * @param defaultValue The default value that should be used if value is `undefined`.
 * @returns The optional type.
 */
export function optional<T>(type: Type<T>, defaultValue?: T): OptionalType<T> {
  return new OptionalType(type, defaultValue);
}
