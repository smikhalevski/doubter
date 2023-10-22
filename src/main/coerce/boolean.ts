import { freeze, getCanonicalValue, isArray } from '../internal/lang';
import { TYPE_ARRAY, TYPE_BOOLEAN, TYPE_OBJECT } from '../Type';
import { NEVER } from './never';

/**
 * The array of types that are coercible to a boolean with {@link coerceToBoolean}.
 */
export const booleanCoercibleTypes: readonly unknown[] = freeze([
  TYPE_ARRAY,
  TYPE_OBJECT,
  TYPE_BOOLEAN,
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

  if (input === 0 || input === 'false' || input === false || input === null || input === undefined) {
    return false;
  }
  if (input === 1 || input === 'true' || input === true) {
    return true;
  }
  return NEVER;
}
