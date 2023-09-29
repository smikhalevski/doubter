import { getCanonicalValue } from '../internal/lang';
import { coerceToBigInt } from './bigint';
import { coerceToBoolean } from './boolean';
import { coerceToDate } from './date';
import { coerceToNever, NEVER } from './never';
import { coerceToNumber } from './number';
import { coerceToString } from './string';

export function createCoerceToConst(value: unknown): (input: any) => any {
  const canonicalValue = getCanonicalValue(value);

  if (value instanceof Date) {
    return input => {
      if ((input instanceof Date || (input = coerceToDate(input)) !== NEVER) && input.getTime() === value.getTime()) {
        return value;
      }
      return NEVER;
    };
  }
  if (canonicalValue !== canonicalValue) {
    return coerceToNever;
  }
  if (typeof canonicalValue === 'bigint') {
    return input => (coerceToBigInt(input) === canonicalValue ? value : NEVER);
  }
  if (typeof canonicalValue === 'number') {
    return input => (coerceToNumber(input) === canonicalValue ? value : NEVER);
  }
  if (typeof canonicalValue === 'string') {
    return input => (coerceToString(input) === canonicalValue ? value : NEVER);
  }
  if (typeof canonicalValue === 'boolean') {
    return input => (coerceToBoolean(input) === canonicalValue ? value : NEVER);
  }
  return coerceToNever;
}
