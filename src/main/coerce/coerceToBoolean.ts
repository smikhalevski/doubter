import { getCanonicalValueOf, isArray } from '../internal/lang';
import { NEVER } from './never';

/**
 * Coerces a value to a boolean.
 *
 * @param value The non-boolean value to coerce.
 * @returns A boolean value, or {@link NEVER} if coercion isn't possible.
 */
export function coerceToBoolean(value: unknown): boolean {
  if (isArray(value) && value.length === 1 && typeof (value = value[0]) === 'boolean') {
    return value;
  }

  value = getCanonicalValueOf(value);

  if (typeof value === 'boolean') {
    return value;
  }
  if (value === null || value === undefined || value === false || value === 0 || value === 'false') {
    return false;
  }
  if (value === true || value === 1 || value === 'true') {
    return true;
  }
  return NEVER;
}
