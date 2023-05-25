export const isArray = Array.isArray;

/**
 * [SameValueZero](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevaluezero) comparison.
 */
export function isEqual(a: unknown, b: unknown): boolean {
  return a === b || (a !== a && b !== b);
}

export function isObjectLike<T extends Record<any, any>>(value: unknown): value is T {
  return value !== null && typeof value === 'object';
}

export function isObject(value: unknown): boolean {
  return isObjectLike(value) && !isArray(value);
}

export function isPlainObject(value: any): boolean {
  let proto;
  return isObjectLike(value) && ((proto = Object.getPrototypeOf(value)) === null || proto.constructor === Object);
}

export function isIterableObject(value: any): value is Iterable<any> {
  return isObjectLike(value) && ((typeof Symbol !== 'undefined' && Symbol.iterator in value) || !isNaN(value.length));
}

export function isEqualOrSubclass(ctor: Function, superCtor: Function): boolean {
  return ctor === superCtor || superCtor.prototype.isPrototypeOf(ctor.prototype);
}

export function isNumber(value: unknown): boolean {
  return typeof value === 'number' && value === value;
}

export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && (value = value.getTime()) === value;
}

export function isMapEntry(value: unknown): value is [unknown, unknown] {
  return isArray(value) && value.length === 2;
}

/**
 * Returns primitive if an object is a wrapper, or returns value as is.
 */
export function getCanonicalValueOf(value: unknown): unknown {
  if (isObjectLike(value) && (value instanceof String || value instanceof Number || value instanceof Boolean)) {
    return value.valueOf();
  }
  return value;
}

export function returnTrue(): boolean {
  return true;
}
