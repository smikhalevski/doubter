export const isArray = Array.isArray;

export function identity<T>(value: T): T {
  return value;
}

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

export function isPlainObject(value: unknown): value is object {
  return isObjectLike(value) && ((value = Object.getPrototypeOf(value)) === null || value === Object.prototype);
}

export function isIterableObject(value: any): value is Iterable<any> {
  return isObjectLike(value) && ((typeof Symbol !== 'undefined' && Symbol.iterator in value) || !isNaN(value.length));
}

export function isEqualOrSubclass(ctor: Function, superCtor: Function): boolean {
  return ctor === superCtor || superCtor.prototype.isPrototypeOf(ctor.prototype);
}

export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && (value = value.getTime()) === value;
}

export function isMapEntry(value: unknown): value is [unknown, unknown] {
  return isArray(value) && value.length === 2;
}

/**
 * Returns primitive if
 * [an object is a wrapper](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#primitive_values),
 * is provided or returns the value as is.
 *
 * @param value The value to unwrap.
 */
export function getCanonicalValue(value: unknown): unknown {
  if (
    isObjectLike(value) &&
    ((typeof BigInt !== 'undefined' && value instanceof BigInt) ||
      value instanceof String ||
      value instanceof Number ||
      value instanceof Boolean ||
      value instanceof Symbol)
  ) {
    return value.valueOf();
  }
  return value;
}
