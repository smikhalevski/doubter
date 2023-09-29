import { getCanonicalValueOf, isArray } from '../internal/lang';
import { ReadonlyDict } from '../internal/objects';
import { NEVER } from './never';

/**
 * Coerces a value to an enum value.
 */
export function createCoerceToEnum(
  source: readonly unknown[] | ReadonlyDict,
  values: readonly unknown[]
): (input: unknown) => any {
  return input => {
    if (isArray(input) && input.length === 1 && values.includes((input = input[0]))) {
      return input;
    }
    if (!isArray(source) && typeof (input = getCanonicalValueOf(input)) === 'string' && source.hasOwnProperty(input)) {
      return (source as ReadonlyDict)[input];
    }
    return NEVER;
  };
}
