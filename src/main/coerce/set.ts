import { unique } from '../internal/arrays';
import { getCanonicalValueOf, isArray, isIterableObject } from '../internal/lang';
import { TYPE_SET } from '../Type';

export const setTypes: unknown[] = [TYPE_SET];

/**
 * Coerces a value to an array of unique {@link !Set Set} values.
 *
 * @param value The value to coerce.
 * @returns An array, or {@link NEVER} if coercion isn't possible.
 */
export function coerceToUniqueValues(value: unknown): unknown[] {
  if (isArray(value)) {
    return unique(value);
  }
  if (isIterableObject((value = getCanonicalValueOf(value)))) {
    return unique(Array.from(value));
  }
  return [value];
}
