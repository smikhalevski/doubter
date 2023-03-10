import { isArray, isEqual } from './lang';

declare const TYPE: unique symbol;

class T<T extends string> {
  private declare [TYPE]: unknown;

  constructor(readonly type: T) {
    Object.freeze(this);
  }

  toString() {
    return this.type;
  }
}

Object.freeze(T.prototype);

export const ARRAY = new T('array');
export const BIGINT = new T('bigint');
export const BOOLEAN = new T('boolean');
export const DATE = new T('date');
export const FUNCTION = new T('function');
export const MAP = new T('map');
export const NULL = new T('null');
export const NUMBER = new T('number');
export const OBJECT = new T('object');
export const PROMISE = new T('promise');
export const SET = new T('set');
export const STRING = new T('string');
export const SYMBOL = new T('symbol');
export const UNDEFINED = new T('undefined');
export const UNKNOWN = new T('unknown');

export type Type =
  | T<'array'>
  | T<'bigint'>
  | T<'boolean'>
  | T<'date'>
  | T<'function'>
  | T<'map'>
  | T<'null'>
  | T<'number'>
  | T<'object'>
  | T<'promise'>
  | T<'set'>
  | T<'string'>
  | T<'symbol'>
  | T<'undefined'>
  | T<'unknown'>;

export function getTypeOf(value: unknown): Type {
  const type = typeof value;

  if (type === 'undefined') {
    return UNDEFINED;
  }
  if (type === 'boolean') {
    return BOOLEAN;
  }
  if (type === 'number') {
    return NUMBER;
  }
  if (type === 'string') {
    return STRING;
  }
  if (type === 'function') {
    return FUNCTION;
  }
  if (type === 'symbol') {
    return SYMBOL;
  }
  if (type === 'bigint') {
    return BIGINT;
  }
  if (value === null) {
    return NULL;
  }
  if (isArray(value)) {
    return ARRAY;
  }
  if (value instanceof Date) {
    return DATE;
  }
  if (value instanceof Promise) {
    return PROMISE;
  }
  if (value instanceof Set) {
    return SET;
  }
  if (value instanceof Map) {
    return MAP;
  }
  return OBJECT;
}

export function isType(type: unknown): type is Type {
  return (
    type === ARRAY ||
    type === BIGINT ||
    type === BOOLEAN ||
    type === DATE ||
    type === FUNCTION ||
    type === MAP ||
    type === NULL ||
    type === NUMBER ||
    type === OBJECT ||
    type === PROMISE ||
    type === SET ||
    type === STRING ||
    type === SYMBOL ||
    type === UNDEFINED ||
    type === UNKNOWN
  );
}

function isAssignable(a: unknown, b: unknown): boolean {
  return b === UNKNOWN || isEqual(a, b) || (!isType(a) && isType(b) && getTypeOf(a) === b);
}

export function unionTypes(types: unknown[]): unknown[] {
  let t = types;

  next: for (let i = 0; i < t.length; ++i) {
    const ti = t[i];

    for (let j = i + 1; j < t.length; ++j) {
      const tj = t[j];

      if (isAssignable(ti, tj)) {
        if (t === types) {
          t = types.slice(0);
        }
        t.splice(i--, 1);
        continue next;
      }

      if (isAssignable(tj, ti)) {
        if (t === types) {
          t = types.slice(0);
        }
        t.splice(j--, 1);
      }
    }
  }

  return t;
}

export function intersectTypes(types: unknown[]): unknown[] {
  let t = types;

  next: for (let i = 0; i < t.length; ++i) {
    const ti = t[i];

    for (let j = i + 1; j < t.length; ++j) {
      const tj = t[j];

      if (isAssignable(tj, ti)) {
        if (t === types) {
          t = types.slice(0);
        }
        t.splice(i--, 1);
        // leave tj
        continue next;
      }

      if (isAssignable(ti, tj)) {
        if (t === types) {
          t = types.slice(0);
        }
        t.splice(j--, 1);
        // leave ti
        continue;
      }

      return [];
    }
  }
  return t;
}

// (a | b) & (a | b | c) → a | b
export function distributeTypes(types: unknown[][]): unknown[] {
  if (types.length === 0) {
    return [];
  }

  const t = [];
  const t0 = types[0];

  for (let i = 0; i < t0.length; ++i) {
    const t0i = t0[i];

    for (let k = 1; k < types.length; ++k) {
      const tk = types[k];

      for (let j = 0; j < tk.length; ++j) {
        const tkj = tk[j];

        if (isAssignable(tkj, t0i)) {
          t.push(tkj);
        } else if (isAssignable(t0i, tkj)) {
          t.push(t0i);
        }
      }
    }
  }

  return t;
}
