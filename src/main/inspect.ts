import { isArray } from './internal/lang';

/**
 * Returns human-readable stringified value representation.
 *
 * @param value The value to stringify.
 * @param indent The number of indentation spaces inside code blocks.
 * @param wrapAt The number of characters in a single line after which a code is wrapped.
 */
export function inspect(value: any, indent = 2, wrapAt = 80): string {
  return inspectValue(value, new Map(), '#', '', 0, indent, indent === 2 ? '  ' : ' '.repeat(indent), wrapAt);
}

function inspectValue(
  value: any,
  objectPaths: Map<object, string>,
  parentPath: string,
  key: string | number,
  depth: number,
  indent: number,
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

  let length = depth * indent + 2;
  let opening = '[';
  let closing = ']';
  let padding = '';

  const chunks = [];

  if (!isArray(value)) {
    const constructorName = getConstructorName(value);

    if (constructorName === '') {
      length += 2;
      opening = '{';
    } else {
      length += constructorName.length + 3;
      opening = constructorName + ' {';
    }

    closing = '}';
    padding = ' ';

    if (value instanceof Map || value instanceof Set) {
      value = Array.from(value);
    }
  }

  if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const chunk = inspectValue(value[i], objectPaths, parentPath, i, depth + 1, indent, space, wrapAt);

      chunks.push(chunk);
      length += chunk.length;
    }
  } else {
    for (const key in value) {
      const keyChunk = isUnquotedKey(key) ? key : JSON.stringify(key);
      const chunk =
        keyChunk + ': ' + inspectValue(value[key], objectPaths, parentPath, keyChunk, depth + 1, indent, space, wrapAt);

      chunks.push(chunk);
      length += chunk.length;
    }

    padding = chunks.length === 0 ? '' : ' ';
  }

  return length > wrapAt
    ? opening + '\n' + chunks.join(',\n').replace(/^/gm, space) + '\n' + closing
    : opening + padding + chunks.join(', ') + padding + closing;
}

function getConstructorName(obj: object): string {
  const prototype = Object.getPrototypeOf(obj);

  if (prototype === null || typeof prototype.constructor !== 'function' || prototype.constructor === Object) {
    return '';
  }
  return prototype.constructor.name;
}

/**
 * Returns `true` if key doesn't require quotes.
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
