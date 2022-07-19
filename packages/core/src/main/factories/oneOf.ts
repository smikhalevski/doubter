import { Dict, Primitive } from '../shared-types';
import { OneOfType } from '../types';
import { isObjectLike } from '../utils';

export function oneOf<U extends Primitive, T extends [U, ...U[]]>(...values: T): OneOfType<T[number]>;

export function oneOf<U extends Primitive, T extends readonly [U, ...U[]]>(...values: T): OneOfType<T[number]>;

export function oneOf<T extends Dict<string | number>>(values: T): OneOfType<T[keyof T]>;

export function oneOf(value: Primitive | Dict<string | number>): OneOfType<any> {
  const values = [];

  if (isObjectLike(value)) {
    for (const element of Object.values(value)) {
      if (typeof value[element] !== 'number') {
        values.push(element);
      }
    }
  } else {
    for (let i = 0; i < arguments.length; ++i) {
      values.push(arguments[i]);
    }
  }

  return new OneOfType(values);
}
