export const { abs, floor, max } = Math;

export interface ReadonlyDict<T = any> {
  readonly [key: string]: T;
}

export interface Dict<T = any> {
  [key: string]: T;
}

export const isArray = Array.isArray;

/**
 * [SameValueZero](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevaluezero) comparison.
 */
export function isEqual(a: unknown, b: unknown): boolean {
  return a === b || (a !== a && b !== b);
}

export function isObjectLike(value: unknown): boolean {
  return value !== null && typeof value === 'object';
}

export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

export function isPlainObject(value: any): boolean {
  let proto;
  return isObjectLike(value) && ((proto = Object.getPrototypeOf(value)) === null || proto.constructor === Object);
}

export function isIterableObject(value: any): value is Iterable<any> {
  return isObjectLike(value) && (Symbol.iterator in value || !isNaN(value.length));
}

export function isSubclass(ctor: Function, superCtor: Function): boolean {
  return ctor === superCtor || superCtor.prototype.isPrototypeOf(ctor.prototype);
}

export function isNumber(value: unknown): boolean {
  return typeof value === 'number' && value === value;
}

export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && (value = value.getTime()) === value;
}

export function returnTrue(): boolean {
  return true;
}

export function returnFalse(): boolean {
  return false;
}

export function returnArray(): any[] {
  return [];
}

export function unique<T>(arr: T[]): T[];
export function unique<T>(arr: readonly T[]): readonly T[];
export function unique<T>(arr: readonly T[]): readonly T[] {
  let uniqueArr: T[] | null = null;

  for (let i = 0; i < arr.length; ++i) {
    const value = arr[i];

    if (arr.includes(value, i + 1)) {
      if (uniqueArr === null) {
        uniqueArr = arr.slice(0, i);
      }
      continue;
    }
    if (uniqueArr !== null) {
      uniqueArr.push(value);
    }
  }
  return uniqueArr || arr;
}

/**
 * Removes an element at index from an array. Mutates the array!
 *
 * @param arr The array to modify.
 * @param index The index in the array.
 */
export function deleteAt<T>(arr: T[], index: number): T[] {
  if (index >= 0) {
    for (let i = index + 1; i < arr.length; ++i) {
      arr[i - 1] = arr[i];
    }
    arr.pop();
  }
  return arr;
}

/**
 * Returns an array index as a number, or -1 if key isn't an index.
 */
export function toArrayIndex(key: unknown): number {
  let index;

  if (typeof key === 'string' && (index = +key) === index && '' + index === key) {
    key = index;
  }
  if (typeof key === 'number' && floor(key) === key && key >= 0 && key < 0xffffffff) {
    return key;
  }
  return -1;
}

/**
 * Returns primitive if an object is a wrapper, or returns value as is.
 */
export function toPrimitive(value: unknown): unknown {
  if (isObjectLike(value) && (value instanceof String || value instanceof Number || value instanceof Boolean)) {
    return value.valueOf();
  }
  return value;
}

/**
 * Updates object property value, prevents prototype pollution.
 */
export function setObjectProperty(obj: Record<any, any>, key: any, value: unknown): void {
  if (key === '__proto__') {
    Object.defineProperty(obj, key, { value, writable: true, enumerable: true, configurable: true });
  } else {
    obj[key] = value;
  }
}

/**
 * Returns the shallow clone of the instance object.
 */
export function cloneInstance<T extends object>(obj: T): T {
  return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
}

/**
 * Clones a dictionary-like object.
 */
export function cloneDict(dict: ReadonlyDict): Dict {
  const obj = {};

  for (const key in dict) {
    setObjectProperty(obj, key, dict[key]);
  }
  return obj;
}

/**
 * Clones the first `count` keys of a dictionary-like object.
 */
export function cloneDictHead(dict: ReadonlyDict, count: number): Dict {
  const obj = {};

  let index = 0;

  for (const key in dict) {
    if (index >= count) {
      break;
    }
    setObjectProperty(obj, key, dict[key]);
    ++index;
  }
  return obj;
}

/**
 * Clones known keys of a dictionary-like object.
 */
export function cloneDictKeys(dict: ReadonlyDict, keys: readonly string[]): Dict {
  const obj = {};

  for (const key of keys) {
    if (key in dict) {
      setObjectProperty(obj, key, dict[key]);
    }
  }
  return obj;
}
