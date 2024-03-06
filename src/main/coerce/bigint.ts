import { getCanonicalValue, isArray } from '../internal/lang';
import { Type } from '../Type';
import { NEVER } from './never';

/**
 * The array of inputs that are coercible to a bigint with {@link coerceToBigInt}.
 */
export const bigintCoercibleInputs = Object.freeze([
  Type.ARRAY,
  Type.BIGINT,
  Type.OBJECT,
  Type.STRING,
  Type.NUMBER,
  Type.BOOLEAN,
  null,
  undefined,
]);

/**
 * Coerces a value to a bigint.
 *
 * @param input The value to coerce.
 * @returns A bigint value, or {@link NEVER} if coercion isn't possible.
 */
export function coerceToBigInt(input: unknown): bigint {
  if (isArray(input) && input.length === 1 && typeof (input = input[0]) === 'bigint') {
    return input;
  }
  if (input === null || input === undefined) {
    return BigInt(0);
  }

  input = getCanonicalValue(input);

  if (
    typeof input === 'bigint' ||
    typeof input === 'number' ||
    typeof input === 'string' ||
    typeof input === 'boolean'
  ) {
    try {
      return BigInt(input);
    } catch {}
  }
  return NEVER;
}
