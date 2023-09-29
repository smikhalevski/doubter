import { getCanonicalValueOf } from '../internal/lang';
import { bigintCoercibleTypes, coerceToBigInt } from './bigint';
import { booleanCoercibleTypes, coerceToBoolean } from './boolean';
import { coerceToDate, dateCoercibleTypes } from './date';
import { coerceToNever, NEVER } from './never';
import { coerceToNumber, numberCoercibleTypes } from './number';
import { coerceToString, stringCoercibleTypes } from './string';

export function getConstCoercibleTypes(value: unknown): readonly unknown[] {
  const canonicalValue = getCanonicalValueOf(value);

  if (value instanceof Date) {
    return dateCoercibleTypes;
  }
  if (canonicalValue !== canonicalValue) {
    return [value];
  }
  if (typeof canonicalValue === 'bigint') {
    return bigintCoercibleTypes;
  }
  if (typeof canonicalValue === 'number') {
    return numberCoercibleTypes;
  }
  if (typeof canonicalValue === 'string') {
    return stringCoercibleTypes;
  }
  if (typeof canonicalValue === 'boolean') {
    return booleanCoercibleTypes;
  }
  return [value];
}

export function createCoerceToConst(value: unknown): (input: any) => any {
  const canonicalValue = getCanonicalValueOf(value);

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
    return input => (typeof input !== 'bigint' && coerceToBigInt(input) === canonicalValue ? value : NEVER);
  }
  if (typeof canonicalValue === 'number') {
    return input => (typeof input !== 'number' && coerceToNumber(input) === canonicalValue ? value : NEVER);
  }
  if (typeof canonicalValue === 'string') {
    return input => (typeof input !== 'string' && coerceToString(input) === canonicalValue ? value : NEVER);
  }
  if (typeof canonicalValue === 'boolean') {
    return input => (typeof input !== 'boolean' && coerceToBoolean(input) === canonicalValue ? value : NEVER);
  }
  return coerceToNever;
}
