import { isArray } from '../internal';
import { NEVER } from '../shape';

export function coerceToUndefined(value: any): undefined {
  if (
    (isArray(value) && value.length === 1 && (value = value[0]) === undefined) ||
    value === null ||
    value === 'undefined' ||
    value === ''
  ) {
    return undefined;
  }
  return NEVER;
}
