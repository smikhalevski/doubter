import { getCanonicalValueOf, isArray } from '../internal/lang';
import { NEVER } from './never';

/**
 * Coerces a value to a number (not `NaN`).
 *
 * @param value The non-number value to coerce.
 * @returns A number value, or {@link NEVER} if coercion isn't possible.
 */
export function coerceToNumber(value: any): number {
  if (isArray(value) && value.length === 1 && typeof (value = value[0]) === 'number') {
    return value === value ? value : NEVER;
  }
  if (value === null || value === undefined) {
    return 0;
  }

  value = getCanonicalValueOf(value);

  if (
    (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number' || value instanceof Date) &&
    (value = +value) === value
  ) {
    return value;
  }
  if (typeof value === 'bigint' && value >= -0x1fffffffffffff && value <= 0x1fffffffffffff) {
    return Number(value);
  }
  return NEVER;
}