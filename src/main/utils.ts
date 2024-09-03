/**
 * The module with the utility functions that can be used for plugin development.
 *
 * ```ts
 * import { createIssue } from 'doubter/utils';
 * ```
 *
 * @module utils
 */

import type { Issue, IssueOptions, Message, ParseOptions } from './core';
import { isArray } from './internal/lang';

export function toIssueOptions<T extends IssueOptions>(options: T | Message | undefined): Partial<T> {
  return options !== null && typeof options === 'object' ? options : ({ message: options } as T);
}

/**
 * Creates a new issue.
 *
 * @param code The issue code.
 * @param input The input value that caused an issue.
 * @param defaultMessage The default message that is used if there's no {@link IssueOptions.message}
 * @param param The issue param that is also passed to the message callback.
 * @param parseOptions The options passed to the {@link core!Shape._apply Shape._apply} or
 * {@link core!Shape._applyAsync Shape._applyAsync}
 * @param issueOptions The issue options or `undefined` if there's no specific issue options.
 */
export function createIssue(
  code: any,
  input: unknown,
  defaultMessage: Message,
  param: unknown,
  parseOptions: ParseOptions,
  issueOptions: IssueOptions | Message | undefined
): Issue {
  const issue: Issue = { code, path: undefined, input, message: undefined, param, meta: undefined };

  let message;

  message =
    (issueOptions !== undefined &&
      ((message = issueOptions),
      typeof issueOptions === 'function' ||
        typeof issueOptions === 'string' ||
        ((issue.meta = issueOptions.meta), (message = issueOptions.message)) !== undefined)) ||
    (parseOptions !== undefined &&
      parseOptions.messages !== undefined &&
      (message = parseOptions.messages[code]) !== undefined)
      ? message
      : defaultMessage;

  if (
    (typeof message === 'function' && ((message = message(issue, parseOptions)), issue.message === undefined)) ||
    message !== undefined
  ) {
    issue.message = message;
  }
  return issue;
}

/**
 * Returns human-readable stringified value representation.
 */
export function inspect(value: any): string {
  return inspectValue(value, new Map(), '#', '', '  ', 80);
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
    (type === 'object' && (value instanceof Number || value instanceof Boolean || value instanceof RegExp))
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
