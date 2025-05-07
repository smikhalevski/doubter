import { getCanonicalValue, isArray, isValidDate } from '../internal/lang.ts';
import { Type } from '../Type.ts';
import { NEVER } from './never.ts';

/**
 * The array of inputs that are coercible to a string with {@link coerceToString}.
 */
export const stringCoercibleInputs = Object.freeze<unknown[]>([
  Type.ARRAY,
  Type.OBJECT,
  Type.STRING,
  Type.NUMBER,
  Type.BOOLEAN,
  Type.BIGINT,
  Type.DATE,
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
