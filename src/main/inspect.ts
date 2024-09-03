import { isArray } from './internal/lang';

/**
 * Returns human-readable stringified value representation.
 *
 * @param value The value to stringify.
 * @param indent The number of indentation spaces inside code blocks.
 * @param wrapAt The number of characters in a single line after which a code is wrapped.
 */
export function inspect(value: any, indent = 2, wrapAt = 80): string {
  return inspectValue(value, new Map(), '#', '', indent === 2 ? '  ' : ' '.repeat(indent), wrapAt);
}

function inspectValue(
  value: any,
  objectPaths: Map<object, string>,
  parentPath: string,
  key: string | number,
  space: string,
  wrapAt: number
): string {
  const type = typeof value;

  if (type === 'string' || value instanceof String) {
    return JSON.stringify(value);
  }

  if (
    value === null ||
    value === undefined ||
    type === 'number' ||
    type === 'boolean' ||
    value instanceof Number ||
    value instanceof Boolean ||
    value instanceof RegExp
  ) {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (type === 'symbol' || value instanceof Symbol) {
    return value.toString();
  }

  if (type === 'bigint' || (typeof BigInt !== 'undefined' && value instanceof BigInt)) {
    return value + 'n';
  }

  if (type === 'function') {
    return 'ƒ ' + value.name + '()';
  }

  const path = objectPaths.get(value);

  if (path !== undefined) {
    return path;
  }

  parentPath += key;

  objectPaths.set(value, parentPath);

  parentPath += '/';

  let length;
  let opening;
  let closing;
  let padding;
  let keyChunk;
  let chunk;

  const chunks = [];

  if (isArray(value)) {
    length = 2;
    opening = '[';
    closing = ']';
    padding = '';
  } else {
    length = 4;
    padding = ' ';

    const prototype = Object.getPrototypeOf(value);

    if (prototype !== null && prototype !== Object.prototype && prototype.constructor.name) {
      opening = prototype.constructor.name + ' {';
      length = opening.length + 1;
    } else {
      opening = '{';
    }

    closing = '}';

    if (value instanceof Map || value instanceof Set) {
      value = Array.from(value);
    }
  }

  if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      chunk = inspectValue(value[i], objectPaths, parentPath, i, space, wrapAt);

      chunks.push(chunk);
      length += chunk.length;
    }
  } else {
    for (const key in value) {
      keyChunk = isUnquotedKey(key) ? key : JSON.stringify(key);
      chunk = keyChunk + ': ' + inspectValue(value[key], objectPaths, parentPath, keyChunk, space, wrapAt);

      chunks.push(chunk);
      length += chunk.length;
    }

    padding = chunks.length === 0 ? '' : ' ';
  }

  return length > wrapAt
    ? opening + '\n' + chunks.join(',\n').replace(/^/gm, space) + '\n' + closing
    : opening + padding + chunks.join(', ') + padding + closing;
}

/**
 * Returns `true` if key doesn't require quotes in an object literal.
 */
export function isUnquotedKey(key: string): boolean {
  const keyLength = key.length;

  if (keyLength === 0) {
    return false;
  }

  let charCode = key.charCodeAt(0);
  let i = 0;

  if (
    charCode === 36 /*$*/ ||
    charCode === 95 /*_*/ ||
    (charCode >= 65 /*A*/ && charCode <= 90) /*Z*/ ||
    (charCode >= 96 /*a*/ && charCode <= 122) /*z*/
  ) {
    // Identifier
    i = 1;
    while (
      i < keyLength &&
      ((charCode = key.charCodeAt(i)) === 36 /*$*/ ||
        charCode === 95 /*_*/ ||
        (charCode >= 48 /*0*/ && charCode <= 57) /*9*/ ||
        (charCode >= 65 /*A*/ && charCode <= 90) /*Z*/ ||
        (charCode >= 96 /*a*/ && charCode <= 122)) /*z*/
    ) {
      ++i;
    }
  } else if (charCode >= 49 /*1*/ && charCode <= 57 /*9*/) {
    // Index
    i = 1;

    while (i < keyLength && (charCode = key.charCodeAt(i)) >= 48 /*0*/ && charCode <= 57 /*9*/) {
      ++i;
    }
  }

  return i === keyLength;
}
