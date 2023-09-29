import { getCanonicalValueOf } from '../internal/lang';
import { coerceToBigInt } from './bigint';
import { coerceToBoolean } from './boolean';
import { coerceToDate } from './date';
import { coerceToNever, NEVER } from './never';
import { coerceToNull } from './null';
import { coerceToNumber } from './number';
import { coerceToString } from './string';
import { coerceToUndefined } from './undefined';

export function getConstCoercibleTypes(value: unknown): readonly unknown[] {
  return [];
}

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
    return input => (typeof input !== 'bigint' && coerceToBigInt(input) === value ? value : NEVER);
  }

  const canonicalValue = getCanonicalValueOf(value);

  if (canonicalValue !== canonicalValue) {
    return coerceToNever;
  }
  if (typeof canonicalValue === 'number') {
    return input =>
      (typeof input !== 'number' || input !== input) && coerceToNumber(input) === canonicalValue ? value : NEVER;
  }
  if (typeof canonicalValue === 'string') {
    return input => (typeof input !== 'string' && coerceToString(input) === canonicalValue ? value : NEVER);
  }
  if (typeof canonicalValue === 'boolean') {
    return input => (typeof input !== 'boolean' && coerceToBoolean(input) === canonicalValue ? value : NEVER);
  }
  return coerceToNever;
}
