export interface ReadonlyDict<T = any> {
  readonly [key: string]: T;
}

export interface Dict<T = any> {
  [key: string]: T;
}

export function overrideProperty<T>(obj: object, key: PropertyKey, value: T): T {
  Object.defineProperty(obj, key, { value, writable: false, configurable: true });
  return value;
}

/**
 * Updates object property value, prevents prototype pollution.
 */
export function setObjectProperty<T>(obj: any, key: PropertyKey, value: T): T {
  if (key === '__proto__') {
    Object.defineProperty(obj, key, { value, writable: true, enumerable: true, configurable: true });
  } else {
    obj[key] = value;
  }
  return value;
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
