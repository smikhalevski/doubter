import { getCanonicalValueOf, isArray, isValidDate } from '../internal/lang';
import { TYPE_ARRAY, TYPE_BIGINT, TYPE_BOOLEAN, TYPE_DATE, TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING } from '../Type';
import { NEVER } from './never';

export const stringTypes: unknown[] = [TYPE_STRING];

/**
 * The list of types that are coercible to string with {@link coerceToString}.
 */
export const stringCoercibleTypes: unknown[] = [
  TYPE_ARRAY,
  TYPE_OBJECT,
  TYPE_STRING,
  TYPE_NUMBER,
  TYPE_BOOLEAN,
  TYPE_BIGINT,
  TYPE_DATE,
  null,
  undefined,
];

/**
 * Coerces a value to a string.
 *
 * @param value The value to coerce.
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
