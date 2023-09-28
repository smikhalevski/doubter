import { isArray } from '../internal/lang';
import { NEVER } from './NEVER';

export function coerceToUndefined(value: any): undefined {
  if (
    (isArray(value) && value.length === 1 && (value = value[0]) === undefined) ||
    value === null ||
    value === undefined
  ) {
    return undefined;
  }
  return NEVER;
}
