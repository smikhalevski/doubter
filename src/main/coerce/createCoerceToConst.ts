import { getCanonicalValueOf, isArray } from '../internal';
import { NEVER } from '../shape';
import { coerceToBigInt } from './coerceToBigInt';
import { coerceToBoolean } from './coerceToBoolean';
import { coerceToDate } from './coerceToDate';
import { coerceToNever } from './coerceToNever';
import { coerceToNull } from './coerceToNull';
import { coerceToNumber } from './coerceToNumber';
import { coerceToString } from './coerceToString';
import { coerceToUndefined } from './coerceToUndefined';

export function createCoerceToConst(value: unknown): (input: any) => any {
  if (value === null) {
    return coerceToNull;
  }
  if (value === undefined) {
    return coerceToUndefined;
  }
  if (value instanceof Date) {
    return input => {
      if ((input instanceof Date || (input = coerceToDate(input)) !== NEVER) && input.getTime() === value.getTime()) {
        return value;
      }
      return NEVER;
    };
  }
  if (typeof value === 'bigint') {
    return input => (coerceToBigInt(input) === value ? value : NEVER);
  }

  const canonicalValue = getCanonicalValueOf(value);

  if (canonicalValue !== canonicalValue) {
    return input => {
      if (
        (isArray(input) && input.length === 1 && (input = input[0]) !== input) ||
        input === 'NaN' ||
        input === null ||
        input === undefined
      ) {
        return value;
      }
      return NEVER;
    };
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
