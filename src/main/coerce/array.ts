import { freeze, getCanonicalValueOf, isIterableObject } from '../internal/lang';
import { TYPE_ARRAY, TYPE_OBJECT } from '../Type';

/**
 * The list of types that are coercible to array with {@link coerceToArray}.
 */
export const arrayCoercibleTypes: readonly unknown[] = freeze([TYPE_OBJECT, TYPE_ARRAY]);

/**
 * Coerces a value to an array.
 *
 * @param input The value to coerce.
 * @returns An array, or {@link NEVER} if coercion isn't possible.
 */
export function coerceToArray(input: unknown): unknown[] {
  input = getCanonicalValueOf(input);

  if (isIterableObject(input)) {
    return Array.from(input);
  }
  return [input];
}
