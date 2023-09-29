import { getCanonicalValueOf, isArray, isIterableObject, isMapEntry, isObjectLike } from '../internal/lang';
import { NEVER } from './never';

/**
 * Coerces a value to an array of {@link !Map Map} entries.
 *
 * @param value A non-{@link !Map Map} value to coerce.
 * @returns An array of entries, or {@link NEVER} if coercion isn't possible.
 */
export function coerceToMapEntries(value: any): [unknown, unknown][] {
  if (isArray(value)) {
    return value.every(isMapEntry) ? value : NEVER;
  }

  value = getCanonicalValueOf(value);

  if (isIterableObject(value)) {
    value = Array.from(value);

    return value.every(isMapEntry) ? value : NEVER;
  }
  if (isObjectLike(value)) {
    return Object.entries(value);
  }
  return NEVER;
}
