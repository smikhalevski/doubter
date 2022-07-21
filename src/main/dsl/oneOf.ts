import { Dict, Primitive, Several } from '../shared-types';
import { OneOfType } from '../types';
import { isObjectLike } from '../utils';

/**
 * The type definition that constrains input with the list of primitive values.
 *
 * @param values The list of values allowed for the input.
 */
export function oneOf<U extends Several<Primitive>>(...values: U): OneOfType<U[number]>;

/**
 * The type definition that constrains input with values of the enum-like object.
 *
 * @param values The enum-like object.
 */
export function oneOf<U extends Dict<string | number>>(values: U): OneOfType<U[keyof U]>;

export function oneOf(arg0: Primitive | Dict<string | number>): OneOfType<any> {
  const values = [];

  if (isObjectLike(arg0)) {
    for (const value of Object.values(arg0)) {
      if (typeof arg0[value] !== 'number') {
        values.push(value);
      }
    }
  } else {
    for (let i = 0; i < arguments.length; ++i) {
      values.push(arguments[i]);
    }
  }

  return new OneOfType(values);
}
