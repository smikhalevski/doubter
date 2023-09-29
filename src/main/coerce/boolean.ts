import { getCanonicalValueOf, isArray } from '../internal/lang';
import { TYPE_ARRAY, TYPE_BOOLEAN, TYPE_OBJECT } from '../Type';
import { NEVER } from './never';

export const booleanTypes: unknown[] = [TYPE_BOOLEAN];

/**
 * The list of types that are coercible to boolean with {@link coerceToBoolean}.
 */
export const booleanCoercibleTypes: unknown[] = [
  TYPE_ARRAY,
  TYPE_OBJECT,
  TYPE_BOOLEAN,
  'false',
  'true',
  0,
  1,
  null,
  undefined,
];

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
