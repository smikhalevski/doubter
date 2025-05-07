import { getCanonicalValue, isArray, isIterableObject, isMapEntry, isObjectLike } from '../internal/lang.ts';
import { NEVER } from './never.ts';

/**
 * Coerces a value to an array of Map entries.
 *
 * @param input A value to coerce.
 * @returns An array of entries, or {@link NEVER} if coercion isn't possible.
 */
export function coerceToMapEntries(input: unknown): [unknown, unknown][] {
  if (isArray(input)) {
    return input.every(isMapEntry) ? input : NEVER;
  }

  input = getCanonicalValue(input);

  if (isIterableObject(input)) {
    return (input = Array.from(input)).every(isMapEntry) ? input : NEVER;
  }
  if (isObjectLike(input)) {
    return Object.entries(input);
  }
  return NEVER;
}
