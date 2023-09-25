import { isArray } from '../internal';
import { NEVER } from '../shape';

export function coerceToNull(value: any): null {
  if (
    (isArray(value) && value.length === 1 && (value = value[0]) === null) ||
    value === undefined ||
    value === 'null' ||
    value === ''
  ) {
    return null;
  }
  return NEVER;
}
