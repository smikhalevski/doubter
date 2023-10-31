import { freeze, getCanonicalValue, isArray, isEqual } from '../internal/lang';
import { TYPE_ARRAY, TYPE_OBJECT } from '../types';
import { bigintCoercibleInputs, coerceToBigInt } from './bigint';
import { booleanCoercibleInputs, coerceToBoolean } from './boolean';
import { coerceToDate, dateCoercibleInputs } from './date';
import { NEVER } from './never';
import { coerceToNumber, numberCoercibleInputs } from './number';
import { coerceToString, stringCoercibleInputs } from './string';

/**
 * The array of inputs that are coercible to `NaN` with {@link coerceToConst}.
 */
const nanCoercibleInputs = freeze<unknown[]>([
  TYPE_ARRAY,
  TYPE_OBJECT, // new Number(NaN)
  NaN,
]);

/**
 * Returns the array of types that are coercible to a constant value with {@link coerceToConst}.
 */
export function getConstCoercibleInputs(value: unknown): readonly unknown[] {
  const canonicalValue = getCanonicalValue(value);

  if (typeof canonicalValue === 'bigint') {
    return bigintCoercibleInputs;
  }
  if (typeof canonicalValue === 'number') {
    return canonicalValue !== canonicalValue ? nanCoercibleInputs : numberCoercibleInputs;
  }
  if (typeof canonicalValue === 'string') {
    return stringCoercibleInputs;
  }
  if (typeof canonicalValue === 'boolean') {
    return booleanCoercibleInputs;
  }
  if (value instanceof Date) {
    return dateCoercibleInputs;
  }
  return [TYPE_ARRAY, value];
}

/**
 * Coerces an input value to the given constant value.
 *
 * @param value The literal value to which an `input` must be coerced.
 * @param input The input to coerce.
 * @returns `value` if `input` is coercible to `value` or {@link NEVER} if coercion isn't possible.
 */
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

    // Date
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
