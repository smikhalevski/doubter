import { getCanonicalValueOf, isArray, isValidDate } from '../internal/lang';
import { NEVER } from './never';

/**
 * Coerces a value to a {@link !Date Date}.
 *
 * @param value The non-{@link !Date Date} value to coerce.
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
