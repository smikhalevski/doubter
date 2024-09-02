export interface ReadonlyDict<T = any> {
  readonly [key: string]: T;
}

export interface Dict<T = any> {
  [key: string]: T;
}

export function defineReadonlyProperty<T>(obj: object, key: PropertyKey, value: T): T {
  Object.defineProperty(obj, key, { value, configurable: true });
  return value;
}

/**
 * Updates object property value, prevents prototype pollution.
 */
export function setProperty<T>(obj: any, key: PropertyKey, value: T): T {
  if (key === '__proto__') {
    Object.defineProperty(obj, key, { value, configurable: true, writable: true, enumerable: true });
  } else {
    obj[key] = value;
  }
  return value;
}

/**
 * Shallow-clones a dictionary-like object.
 */
export function cloneObject(dict: ReadonlyDict): Dict {
  const obj = Object.create(Object.getPrototypeOf(dict));

  for (const key in dict) {
    setProperty(obj, key, dict[key]);
  }
  return obj;
}

/**
 * Shallow-clones a dictionary-like object picking only a given set of keys.
 */
export function pickKeys(dict: ReadonlyDict, keys: readonly string[]): Dict {
  const obj = Object.create(Object.getPrototypeOf(dict));

  for (const key of keys) {
    if (key in dict) {
      setProperty(obj, key, dict[key]);
    }
  }
  return obj;
}

/**
 * Shallow-clones a dictionary-like object picking only the first `count` number of keys.
 */
export function cloneRecord(dict: ReadonlyDict, count: number): Dict {
  const obj = Object.create(Object.getPrototypeOf(dict));

  let index = 0;

  for (const key in dict) {
    if (index >= count) {
      break;
    }
    setProperty(obj, key, dict[key]);
    ++index;
  }
  return obj;
}
