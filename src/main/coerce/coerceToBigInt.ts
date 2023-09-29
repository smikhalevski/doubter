import { getCanonicalValueOf, isArray } from '../internal/lang';
import { NEVER } from './never';

/**
 * Coerces a value to a bigint.
 *
 * @param value The non-bigint value to coerce.
 * @returns A bigint value, or {@link NEVER} if coercion isn't possible.
 */
export function coerceToBigInt(value: any): bigint {
  if (typeof value === 'bigint' || (isArray(value) && value.length === 1 && typeof (value = value[0]) === 'bigint')) {
    return value;
  }
  if (value === null || value === undefined) {
    return BigInt(0);
  }

  value = getCanonicalValueOf(value);

  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
    try {
      return BigInt(value);
    } catch {}
  }
  return NEVER;
}