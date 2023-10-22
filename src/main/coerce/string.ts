import { freeze, getCanonicalValue, isArray, isValidDate } from '../internal/lang';
import {
  TYPE_ARRAY,
  TYPE_BIGINT,
  TYPE_BOOLEAN,
  TYPE_DATE,
  TYPE_NUMBER,
  TYPE_OBJECT,
  TYPE_STRING,
  TypeArray,
} from '../Type';
import { NEVER } from './never';

/**
 * The array of types that are coercible to a string with {@link coerceToString}.
 */
export const stringCoercibleTypes = freeze<TypeArray>([
  TYPE_ARRAY,
  TYPE_OBJECT,
  TYPE_STRING,
  TYPE_NUMBER,
  TYPE_BOOLEAN,
  TYPE_BIGINT,
  TYPE_DATE,
  null,
  undefined,
]);

/**
 * Coerces a value to a string.
 *
 * @param input The value to coerce.
 * @returns A string value, or {@link NEVER} if coercion isn't possible.
 */
export function coerceToString(input: unknown): string {
  if (isArray(input) && input.length === 1 && typeof (input = input[0]) === 'string') {
    return input;
  }
  if (input === null || input === undefined) {
    return '';
  }

  input = getCanonicalValue(input);

  if (typeof input === 'string') {
    return input;
  }
  if ((typeof input === 'number' && isFinite(input)) || typeof input === 'boolean' || typeof input === 'bigint') {
    return '' + input;
  }
  if (isValidDate(input)) {
    return input.toISOString();
  }
  return NEVER;
}
