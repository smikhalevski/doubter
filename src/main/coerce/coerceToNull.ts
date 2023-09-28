import { isArray } from '../internal/lang';
import { NEVER } from './NEVER';

export function coerceToNull(value: any): null {
  if ((isArray(value) && value.length === 1 && (value = value[0]) === null) || value === null || value === undefined) {
    return null;
  }
  return NEVER;
}
