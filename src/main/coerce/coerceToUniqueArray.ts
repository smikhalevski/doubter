import { getCanonicalValueOf, isArray, isIterableObject, unique } from '../internal';

/**
 * Coerces a value to an array of {@link !Set Set} values.
 *
 * @param value The non-{@link !Set Set} value to coerce.
 * @returns An array, or {@link NEVER} if coercion isn't possible.
 */
export function coerceToUniqueArray(value: unknown): unknown[] {
  if (isArray(value)) {
    return unique(value);
  }
  if (isIterableObject((value = getCanonicalValueOf(value)))) {
    return unique(Array.from(value));
  }
  return [value];
}
