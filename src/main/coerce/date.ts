import { freeze, getCanonicalValueOf, isArray, isValidDate } from '../internal/lang';
import { TYPE_ARRAY, TYPE_DATE, TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING } from '../Type';
import { NEVER } from './never';

/**
 * The list of types that are coercible to `Date` with {@link coerceToDate}.
 */
export const dateCoercibleTypes: readonly unknown[] = freeze([
  TYPE_DATE,
  TYPE_OBJECT,
  TYPE_STRING,
  TYPE_NUMBER,
  TYPE_ARRAY,
]);

/**
 * Coerces a value to a `Date`.
 *
 * @param input The value to coerce.
 * @returns A `Date` value, or {@link NEVER} if coercion isn't possible.
 */
export function coerceToDate(input: unknown): Date {
  if (isArray(input) && input.length === 1 && isValidDate((input = input[0]))) {
    return input;
  }

  input = getCanonicalValueOf(input);

  if ((typeof input === 'string' || typeof input === 'number') && isValidDate((input = new Date(input)))) {
    return input;
  }
  return NEVER;
}
