import { freeze, getCanonicalValue, isArray } from '../internal/lang';
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

const MAX_SAFE_INTEGER = 0x1fffffffffffff;
const MIN_SAFE_INTEGER = -MAX_SAFE_INTEGER;

/**
 * The array of types that are coercible to a number with {@link coerceToNumber}.
 */
export const numberCoercibleTypes = freeze<TypeArray>([
  TYPE_ARRAY,
  TYPE_OBJECT,
  TYPE_NUMBER,
  TYPE_STRING,
  TYPE_BOOLEAN,
  TYPE_BIGINT,
  TYPE_DATE,
  null,
  undefined,
]);

/**
 * The array of types that are coercible to `NaN` with {@link coerceToNumber}.
 */
export const nanCoercibleTypes = freeze<TypeArray>([
  TYPE_ARRAY,
  TYPE_OBJECT, // new Number(NaN)
  NaN,
]);

/**
 * Coerces a value to a number (not `NaN`).
 *
 * @param input The value to coerce.
 * @returns A number value, or {@link NEVER} if coercion isn't possible.
 */
export function coerceToNumber(input: unknown): number {
  if (isArray(input) && input.length === 1 && typeof (input = input[0]) === 'number') {
    return input === input ? input : NEVER;
  }
  if (input === null || input === undefined) {
    return 0;
  }

  input = getCanonicalValue(input);

  if (
    (typeof input === 'string' || typeof input === 'boolean' || typeof input === 'number' || input instanceof Date) &&
    (input = +input) === input
  ) {
    return input as number;
  }
  if (typeof input === 'bigint' && input >= MIN_SAFE_INTEGER && input <= MAX_SAFE_INTEGER) {
    return Number(input);
  }
  return NEVER;
}
