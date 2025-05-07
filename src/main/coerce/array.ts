import { unique } from '../internal/arrays.js';
import { getCanonicalValue, isArray, isIterableObject } from '../internal/lang.js';

/**
 * Coerces a value to an array.
 *
 * @param input The value to coerce.
 * @returns An array.
 */
export function coerceToArray(input: unknown): unknown[] {
  if (isIterableObject(getCanonicalValue(input))) {
    return Array.from(input as Iterable<unknown>);
  }
  return [input];
}

/**
 * Coerces a value to an array of unique values.
 *
 * @param input The value to coerce.
 * @returns An array of unique values.
 */
export function coerceToUniqueArray(input: unknown): unknown[] {
  return unique(isArray(input) ? input : coerceToArray(input));
}
