import { getCanonicalValueOf, isIterableObject } from '../internal';

/**
 * Coerces a value to an array.
 *
 * @param value The non-array value to coerce.
 * @returns An array, or {@link NEVER} if coercion isn't possible.
 */
export function coerceToArray(value: unknown): unknown[] {
  value = getCanonicalValueOf(value);

  if (isIterableObject(value)) {
    return Array.from(value);
  }
  return [value];
}
