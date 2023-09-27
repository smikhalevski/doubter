import { getCanonicalValueOf, isArray, isValidDate } from '../internal';
import { NEVER } from '../shape';

/**
 * Coerces a value to a string.
 *
 * @param value The non-string value to coerce.
 * @returns A string value, or {@link NEVER} if coercion isn't possible.
 */
export function coerceToString(value: unknown): string {
  if (isArray(value) && value.length === 1 && typeof (value = value[0]) === 'string') {
    return value;
  }
  if (value === null || value === undefined) {
    return '';
  }

  value = getCanonicalValueOf(value);

  if (typeof value === 'string') {
    return value;
  }
  if ((typeof value === 'number' && isFinite(value)) || typeof value === 'boolean' || typeof value === 'bigint') {
    return '' + value;
  }
  if (isValidDate(value)) {
    return value.toISOString();
  }
  return NEVER;
}
