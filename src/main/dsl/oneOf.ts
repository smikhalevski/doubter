import { Dict, Primitive, Several } from '../shared-types';
import { OneOfType } from '../types';

/**
 * The type definition that constrains input with the list of primitive values.
 *
 * @param values The list of values allowed for the input.
 */
export function oneOf<T extends Primitive, U extends Several<T>>(values: U): OneOfType<U[number]>;

/**
 * The type definition that constrains input with values of the enum-like object.
 *
 * @param values The enum-like object.
 */
export function oneOf<U extends Dict<string | number>>(values: U): OneOfType<U[keyof U]>;

export function oneOf(values: Several<Primitive> | Dict<string | number>): OneOfType<any> {
  if (Array.isArray(values)) {
    return new OneOfType(values);
  }

  const enumValues = [];

  for (const value of Object.values(values)) {
    if (typeof values[value] !== 'number') {
      enumValues.push(value);
    }
  }

  return new OneOfType(enumValues);
}
