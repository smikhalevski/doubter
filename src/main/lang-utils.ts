export interface PropertyDescriptor<T, V> {
  configurable?: boolean;
  enumerable?: boolean;
  value?: V;
  writable?: boolean;

  get?(this: T): V;

  set?(this: T, value: V): void;
}

export type Constructor<T = any> = new (...args: any[]) => T;

export const createObject: <T>(prototype: T) => T = Object.create;

export const objectAssign = Object.assign;

export const defineProperty: <T, P extends keyof T>(object: T, key: P, descriptor: PropertyDescriptor<T, T[P]>) => T =
  Object.defineProperty;

export function extendClass<T>(constructor: Constructor<T>, baseConstructor: Constructor): T {
  const prototype = createObject(baseConstructor.prototype);
  constructor.prototype = prototype;
  prototype.constructor = constructor;
  return prototype;
}

export function isObjectLike(value: unknown): value is Record<any, any> {
  return value !== null && typeof value === 'object';
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export const isArray = Array.isArray;

export const isEqual = Object.is;

export const isInteger = Number.isInteger as (value: unknown) => value is number;

export const isFinite = Number.isFinite as (value: unknown) => value is number;
