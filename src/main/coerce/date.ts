import { getCanonicalValueOf, isArray, isValidDate } from '../internal/lang';
import { TYPE_ARRAY, TYPE_DATE, TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING } from '../Type';
import { NEVER } from './never';

/**
 * The list of types that are coercible to date with {@link coerceToDate}.
 */
export const dateCoercibleTypes: unknown[] = [TYPE_DATE, TYPE_OBJECT, TYPE_STRING, TYPE_NUMBER, TYPE_ARRAY];

/**
 * Coerces a value to a {@link !Date Date}.
 *
 * @param value The value to coerce.
 * @returns A {@link !Date Date} value, or {@link NEVER} if coercion isn't possible.
 */
export function coerceToDate(value: unknown): Date {
  if (isArray(value) && value.length === 1 && isValidDate((value = value[0]))) {
    return value;
  }

  value = getCanonicalValueOf(value);

  if ((typeof value === 'string' || typeof value === 'number') && isValidDate((value = new Date(value)))) {
    return value;
  }
  return NEVER;
}
