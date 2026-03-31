import { getCanonicalValue, isArray } from '../internal/lang.js';
import { Type } from '../Type.js';
import { NEVER } from './never.js';

/**
 * The array of inputs that are coercible to a boolean with {@link coerceToBoolean}.
 */
export const booleanCoercibleInputs = Object.freeze<unknown[]>([
  Type.ARRAY,
  Type.OBJECT,
  Type.BOOLEAN,
  'false',
  'true',
  0,
  1,
  null,
  undefined,
]);

/**
 * Coerces a value to a boolean.
 *
 * @param input The value to coerce.
 * @returns A boolean value, or {@link NEVER} if coercion isn't possible.
 */
export function coerceToBoolean(input: unknown): boolean {
  if (isArray(input) && input.length === 1 && typeof (input = input[0]) === 'boolean') {
    return input;
  }

  input = getCanonicalValue(input);

  if (
    input === false ||
    input === null ||
    input === undefined ||
    input === 0 ||
    input === '0' ||
    input === 'false' ||
    (typeof input === 'string' && input.length === 5 && input.toLowerCase() === 'false')
  ) {
    return false;
  }
  if (
    input === true ||
    input === 1 ||
    input === '1' ||
    input === 'true' ||
    (typeof input === 'string' && input.length === 4 && input.toLowerCase() === 'true')
  ) {
    return true;
  }
  return NEVER;
}
