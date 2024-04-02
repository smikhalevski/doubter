import { getCanonicalValue, isArray } from '../internal/lang';
import { Type } from '../Type';
import { NEVER } from './never';

const { MIN_SAFE_INTEGER, MAX_SAFE_INTEGER } = Number;

/**
 * The array of inputs that are coercible to a number with {@link coerceToNumber}.
 */
export const numberCoercibleInputs = Object.freeze([
  Type.ARRAY,
  Type.OBJECT,
  Type.NUMBER,
  Type.STRING,
  Type.BOOLEAN,
  Type.BIGINT,
  Type.DATE,
  null,
  undefined,
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
