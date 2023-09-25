import { getCanonicalValueOf, isArray, isIterableObject } from '../internal';

/**
 * Coerces a value to an array of {@link !Set Set} values.
 *
 * @param value The non-{@link !Set Set} value to coerce.
 * @returns An array, or {@link NEVER} if coercion isn't possible.
 */
export function coerceToSetValues(value: unknown): unknown[] {
  value = getCanonicalValueOf(value);

  if (isArray(value)) {
    return value;
  }
  if (isIterableObject(value)) {
    return Array.from(value);
  }
  return [value];
}
