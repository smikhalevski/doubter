import { getCanonicalValue, isArray } from '../internal/lang.ts';
import { Type } from '../Type.ts';
import { NEVER } from './never.ts';

/**
 * The array of inputs that are coercible to a number with {@link coerceToNumber}.
 */
export const numberCoercibleInputs = Object.freeze<unknown[]>([
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
  if (typeof input === 'bigint' && input >= Number.MIN_SAFE_INTEGER && input <= Number.MAX_SAFE_INTEGER) {
    return Number(input);
  }
  return NEVER;
}
