import { getCanonicalValueOf, isIterableObject } from '../internal/lang';
import { TYPE_ARRAY, TYPE_OBJECT } from '../Type';

export const arrayTypes: unknown[] = [TYPE_ARRAY];

/**
 * The list of types that are coercible to array with {@link coerceToArray}.
 */
export const arrayCoercibleTypes: unknown[] = [TYPE_OBJECT, TYPE_ARRAY];

/**
 * Coerces a value to an array.
 *
 * @param value The non-array value to coerce.
 * @returns An array, or {@link NEVER} if coercion isn't possible.
 */
export function coerceToArray(value: unknown): unknown[] {
  value = getCanonicalValueOf(value);

  if (isIterableObject(value)) {
    return Array.from(value);
  }
  return [value];
}
