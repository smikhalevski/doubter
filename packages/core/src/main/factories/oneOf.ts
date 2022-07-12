import { Primitive } from '../shared-types';
import { OneOfType } from '../types';

export function oneOf<T extends { [key: string | number]: string | number }>(values: T): OneOfType<T[keyof T]>;

export function oneOf<U extends Primitive, T extends readonly [U, ...U[]]>(values: T): OneOfType<T[number]>;

export function oneOf<U extends Primitive, T extends [U, ...U[]]>(values: T): OneOfType<T[number]>;

export function oneOf(values: any): OneOfType<any> {
  if (Array.isArray(values)) {
    return new OneOfType(values);
  }

  const keys = Object.keys(values);

  values = Object.values(values);

  for (const key of keys) {
    const keyIndex = values.indexOf(key);
    if (keyIndex !== -1) {
      values.splice(keyIndex, 1);
    }
  }

  return new OneOfType(values);
}
