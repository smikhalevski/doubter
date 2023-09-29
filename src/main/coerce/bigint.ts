import { getCanonicalValueOf, isArray } from '../internal/lang';
import { TYPE_ARRAY, TYPE_BIGINT, TYPE_BOOLEAN, TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING } from '../Type';
import { NEVER } from './never';

export const bigintTypes: unknown[] = [TYPE_BIGINT];

/**
 * The list of types that are coercible to bigint with {@link coerceToBigInt}.
 */
export const bigintCoercibleTypes: unknown[] = [
  TYPE_ARRAY,
  TYPE_BIGINT,
  TYPE_OBJECT,
  TYPE_STRING,
  TYPE_NUMBER,
  TYPE_BOOLEAN,
  null,
  undefined,
];

/**
 * Coerces a value to a bigint.
 *
 * @param value The value to coerce.
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
