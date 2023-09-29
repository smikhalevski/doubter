import { freeze, getCanonicalValueOf, isArray, isIterableObject, isMapEntry, isObjectLike } from '../internal/lang';
import { TYPE_ARRAY, TYPE_MAP, TYPE_OBJECT } from '../Type';
import { NEVER } from './never';

/**
 * The list of types that are coercible to `Map` entries with {@link coerceToMapEntries}.
 */
export const mapCoercibleTypes: readonly unknown[] = freeze([TYPE_MAP, TYPE_OBJECT, TYPE_ARRAY]);

/**
 * Coerces a value to an array of `Map` entries.
 *
 * @param input A value to coerce.
 * @returns An array of entries, or {@link NEVER} if coercion isn't possible.
 */
export function coerceToMapEntries(input: unknown): [unknown, unknown][] {
  if (isArray(input)) {
    return input.every(isMapEntry) ? input : NEVER;
  }

  input = getCanonicalValueOf(input);

  if (isIterableObject(input)) {
    return (input = Array.from(input)).every(isMapEntry) ? input : NEVER;
  }
  if (isObjectLike(input)) {
    return Object.entries(input);
  }
  return NEVER;
}
