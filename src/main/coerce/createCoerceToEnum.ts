import { getCanonicalValueOf, isArray } from '../internal/lang';
import { ReadonlyDict } from '../internal/objects';
import { NEVER } from './NEVER';

/**
 * Coerces a value to an enum value.
 */
export function createCoerceToEnum(
  source: readonly unknown[] | ReadonlyDict,
  values: readonly unknown[]
): (input: any) => any {
  return value => {
    if (isArray(value) && value.length === 1 && values.includes((value = value[0]))) {
      return value;
    }
    if (!isArray(source) && typeof (value = getCanonicalValueOf(value)) === 'string' && source.hasOwnProperty(value)) {
      return (source as ReadonlyDict)[value];
    }
    return NEVER;
  };
}
