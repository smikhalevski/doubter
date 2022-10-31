export interface PropertyDescriptor<T, V> {
  configurable?: boolean;
  enumerable?: boolean;
  value?: V;
  writable?: boolean;

  get?(this: T): V;

  set?(this: T, value: V): void;
}

export type Constructor<T = any> = abstract new (...args: any[]) => T;

export const objectCreate: { <T>(prototype: T): T; (prototype: null): any } = Object.create;

export const objectAssign = Object.assign;

export const objectKeys = Object.keys;

export const objectValues = Object.values;

export const isEqual = Object.is;

export function isObjectLike(value: unknown): value is Record<any, any> {
  return value !== null && typeof value === 'object';
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export const isArray = Array.isArray;

export const isInteger = Number.isInteger as (value: unknown) => value is number;

export const isFinite = Number.isFinite as (value: unknown) => value is number;
