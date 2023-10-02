import { getCanonicalValue, isArray, isEqual } from '../internal/lang';
import { TYPE_ARRAY, TYPE_OBJECT } from '../Type';
import { bigintCoercibleTypes, coerceToBigInt } from './bigint';
import { booleanCoercibleTypes, coerceToBoolean } from './boolean';
import { coerceToDate, dateCoercibleTypes } from './date';
import { NEVER } from './never';
import { coerceToNumber, numberCoercibleTypes } from './number';
import { coerceToString, stringCoercibleTypes } from './string';

export function getConstCoercibleInputs(value: unknown): readonly unknown[] {
  const canonicalValue = getCanonicalValue(value);

  if (typeof canonicalValue === 'bigint') {
    return bigintCoercibleTypes;
  }
  if (typeof canonicalValue === 'number') {
    return canonicalValue !== canonicalValue ? [TYPE_ARRAY, TYPE_OBJECT, value] : numberCoercibleTypes;
  }
  if (typeof canonicalValue === 'string') {
    return stringCoercibleTypes;
  }
  if (typeof canonicalValue === 'boolean') {
    return booleanCoercibleTypes;
  }
  if (value instanceof Date) {
    return dateCoercibleTypes;
  }
  return [TYPE_ARRAY, value];
}

export function coerceToConst<T>(value: T, input: unknown): T {
  if (isArray(input) && input.length === 1 && isEqual((input = input[0]), value)) {
    return value;
  }

  const canonicalValue = getCanonicalValue(value);

  let coercedInput;

  switch (typeof canonicalValue) {
    case 'bigint':
      coercedInput = coerceToBigInt(input);
      break;

    case 'number':
      coercedInput = (input = getCanonicalValue(input)) !== input ? input : coerceToNumber(input);
      break;

    case 'string':
      coercedInput = coerceToString(input);
      break;

    case 'boolean':
      coercedInput = coerceToBoolean(input);
      break;

    case 'object':
      if (
        value !== null &&
        value instanceof Date &&
        (input = coerceToDate(input)) !== NEVER &&
        (input as Date).getTime() === value.getTime()
      ) {
        coercedInput = value;
      } else {
        coercedInput = input;
      }
      break;

    default:
      coercedInput = input;
      break;
  }

  if (isEqual(coercedInput, canonicalValue)) {
    return value;
  }
  return NEVER;
}
