import { unique } from '../internal/arrays';
import { getCanonicalValueOf, isArray, isIterableObject } from '../internal/lang';

/**
 * Coerces a value to an array of unique values.
 *
 * @param input The value to coerce.
 * @returns An array, or {@link NEVER} if coercion isn't possible.
 */
export function coerceToUniqueValues(input: unknown): unknown[] {
  let canonicalValue;

  if (isArray(input)) {
    return unique(input);
  }
  if (isIterableObject((canonicalValue = getCanonicalValueOf(input)))) {
    return unique(Array.from(canonicalValue));
  }
  return [input];
}
