import { isArray, isEqual } from './lang';

declare const TYPE: unique symbol;

interface Type<T extends string> {
  readonly type: T;
  [TYPE]: T;
}

function createType<T extends string>(type: T): Type<T> {
  return Object.freeze<any>({ type });
}

export const ARRAY = createType('array');
export const BIGINT = createType('bigint');
export const BOOLEAN = createType('boolean');
export const DATE = createType('date');
export const FUNCTION = createType('function');
export const MAP = createType('map');
export const NULL = createType('null');
export const NUMBER = createType('number');
export const OBJECT = createType('object');
export const PROMISE = createType('promise');
export const SET = createType('set');
export const STRING = createType('string');
export const SYMBOL = createType('symbol');
export const UNDEFINED = createType('undefined');
export const UNKNOWN = createType('unknown');

type Type_ =
  | Type<'array'>
  | Type<'bigint'>
  | Type<'boolean'>
  | Type<'date'>
  | Type<'function'>
  | Type<'map'>
  | Type<'null'>
  | Type<'number'>
  | Type<'object'>
  | Type<'promise'>
  | Type<'set'>
  | Type<'string'>
  | Type<'symbol'>
  | Type<'undefined'>
  | Type<'unknown'>;

export { Type_ as Type };

export function getType(value: unknown): Type_ {
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

export function isType(type: unknown): type is Type_ {
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

/**
 * Returns `true` if type or literal `a` is assignable to the type or literal `b`.
 */
function isAssignable(a: unknown, b: unknown): boolean {
  return b === UNKNOWN || isEqual(a, b) || (!isType(a) && isType(b) && getType(a) === b);
}

/**
 * Returns an array of unique types and literals that comprise a union.
 */
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

/**
 * Takes an array of arrays of types that are treated as an intersection of unions, and applied distribution rule that
 * produces a union.
 *
 * ```
 * (a | b) & (a | b | c) → a | b
 * ```
 */
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
