import {
  ApplyChecksCallback,
  Check,
  CheckCallback,
  ConstraintOptions,
  Issue,
  Message,
  Ok,
  ParseOptions,
  ReadonlyDict,
  TypeConstraintOptions,
} from './shared-types';
import { AnyShape, Shape, ValueType } from './shapes/Shape';
import { inflateIssue, ValidationError } from './ValidationError';
import { TYPE_ARRAY, TYPE_DATE, TYPE_NULL } from './constants';

export function getValueType(value: unknown): Exclude<ValueType, 'any' | 'never'> {
  const type = typeof value;

  if (type !== 'object') {
    return type;
  }
  if (value === null) {
    return TYPE_NULL;
  }
  if (isArray(value)) {
    return TYPE_ARRAY;
  }
  if (value instanceof Date) {
    return TYPE_DATE;
  }
  return type;
}

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export const isArray = Array.isArray;

export const getPrototypeOf = Object.getPrototypeOf;

export function isEqual(a: unknown, b: unknown): boolean {
  return a === b || (a !== a && b !== b);
}

export function isObjectLike(value: unknown): value is Record<any, any> {
  return value !== null && typeof value === 'object';
}

export function isPlainObject(value: unknown): value is Record<any, any> {
  let prototype;
  return isObjectLike(value) && ((prototype = getPrototypeOf(value)) === null || prototype.constructor === Object);
}

export function isAsyncShapes(shapes: readonly AnyShape[]): boolean {
  let async = false;

  for (let i = 0; i < shapes.length && !async; ++i) {
    async = shapes[i].async;
  }
  return async;
}

export function isUnsafeCheck(check: Check): boolean {
  return check.unsafe;
}

/**
 * Returns an array index, or -1 if key isn't an index.
 */
export function toArrayIndex(key: unknown): number {
  if (typeof key === 'string' && '' + +key === key) {
    key = +key;
  }
  return typeof key === 'number' && Number.isInteger(key) && key >= 0 && key < 0xffffffff ? key : -1;
}

/**
 * Returns the shallow clone of the object.
 */
export function clone<T extends object>(source: T): T {
  return Object.assign(Object.create(getPrototypeOf(source)), source);
}

/**
 * The convenient shortcut to add built-in checks to shapes.
 */
export function appendCheck<S extends Shape>(
  shape: S,
  key: string | undefined,
  options: ConstraintOptions | Message | undefined,
  param: unknown,
  cb: CheckCallback<S['output']>
): S {
  return shape.check(cb, {
    key,
    unsafe: options !== null && typeof options === 'object' && options.unsafe,
    param,
  });
}

/**
 * Returns a function that creates a new issue.
 *
 * @param code The code of the issue.
 * @param defaultMessage The default message that is used if message isn't provided through options.
 * @param options Options provided by the user.
 * @param param The param that is added to the issue.
 * @returns The callback that takes an input and returns an issue.
 */
export function createIssueFactory(
  code: unknown,
  defaultMessage: unknown,
  options: TypeConstraintOptions | Message | undefined,
  param: unknown
): (input: unknown, options: Readonly<ParseOptions>) => Issue[];

/**
 * Returns a function that creates a new issue.
 *
 * @param code The code of the issue.
 * @param defaultMessage The default message that is used if message isn't provided through options.
 * @param options Options provided by the user.
 * @returns The callback that takes an input and a param, and returns an issue.
 */
export function createIssueFactory(
  code: unknown,
  defaultMessage: unknown,
  options: TypeConstraintOptions | Message | undefined
): (input: unknown, options: Readonly<ParseOptions>, param: unknown) => Issue[];

export function createIssueFactory(
  code: unknown,
  defaultMessage: unknown,
  options: TypeConstraintOptions | Message | undefined,
  param?: any
): (input: unknown, options: Readonly<ParseOptions>, param: unknown) => Issue[] {
  const paramKnown = arguments.length === 4;

  let meta: unknown;
  let message: any = defaultMessage;

  if (options !== null && typeof options === 'object') {
    if (options.message !== undefined) {
      message = options.message;
    }
    meta = options.meta;
  } else if (typeof options === 'function') {
    message = options;
  } else if (options != null) {
    message = options;
  }

  if (typeof message === 'function') {
    if (paramKnown) {
      return (input, options) => [
        { code, path: [], input, message: message(param, code, input, meta, options), param, meta },
      ];
    } else {
      return (input, options, param) => [
        { code, path: [], input, message: message(param, code, input, meta, options), param, meta },
      ];
    }
  }

  if (typeof message === 'string') {
    if (paramKnown) {
      message = message.replace('%s', param);
    } else if (message.indexOf('%s') !== -1) {
      return (input, options, param) => [{ code, path: [], input, message: message.replace('%s', param), param, meta }];
    }
  }

  if (paramKnown) {
    return input => [{ code, path: [], input, message, param, meta }];
  } else {
    return (input, options, param) => [{ code, path: [], input, message, param, meta }];
  }
}

export function unshiftPath(issues: Issue[], key: unknown): void {
  let issuesLength = issues.length;

  for (let i = 0; i < issuesLength; ++i) {
    issues[i].path.unshift(key);
  }
}

export function concatIssues(issues: Issue[] | null, result: Issue[]): Issue[] {
  if (issues !== null) {
    issues.push(...result);
    return issues;
  }
  return result;
}

export function captureIssues(error: unknown): Issue[] {
  if (error instanceof ValidationError) {
    return error.issues;
  }
  throw error;
}

export type Flags = number[] | number;

export function setFlag(flags: Flags, index: number): Flags {
  if (typeof flags === 'number') {
    if (index < 32) {
      return flags | (1 << index);
    }
    flags = [flags, 0, 0];
  }

  flags[index >> 5] |= 1 << index % 32;
  return flags;
}

export function isFlagSet(flag: Flags, index: number): boolean {
  if (typeof flag === 'number') {
    return 0 !== flag >>> index;
  } else {
    return 0 !== flag[index >> 5] >>> index % 32;
  }
}

export function setKeyValue(obj: Record<any, any>, key: PropertyKey, value: unknown): void {
  if (key === '__proto__') {
    Object.defineProperty(obj, key, { value, writable: true, enumerable: true, configurable: true });
  } else {
    obj[key as string] = value;
  }
}

export function cloneEnumerableKeys(input: ReadonlyDict, keyCount = -1): ReadonlyDict {
  const output: ReadonlyDict = {};

  if (keyCount < 0) {
    for (const key in input) {
      setKeyValue(output, key, input[key]);
    }
  }
  if (keyCount > 0) {
    let index = 0;

    for (const key in input) {
      if (index === keyCount) {
        break;
      }
      setKeyValue(output, key, input[key]);
      ++index;
    }
  }
  return output;
}

export function cloneKnownKeys(input: ReadonlyDict, keys: readonly string[]): ReadonlyDict {
  const output: ReadonlyDict = {};
  const keysLength = keys.length;

  for (let i = 0; i < keysLength; ++i) {
    const key = keys[i];

    if (key in input) {
      setKeyValue(output, key, input[key]);
    }
  }
  return output;
}

export function createApplyChecksCallback(checks: readonly Check[]): ApplyChecksCallback | null {
  const checksLength = checks.length;

  if (checksLength === 0) {
    return null;
  }

  if (checksLength === 1) {
    const [{ unsafe: unsafe0, callback: cb0 }] = checks;

    return (output, issues, options) => {
      if (issues === null || unsafe0) {
        let result;

        try {
          result = cb0(output, options);
        } catch (error) {
          return concatIssues(issues, captureIssues(error));
        }
        if (result != null) {
          return appendIssue(issues, result);
        }
      }
      return issues;
    };
  }

  if (checksLength === 2) {
    const [{ unsafe: unsafe0, callback: cb0 }, { unsafe: unsafe1, callback: cb1 }] = checks;

    return (output, issues, options) => {
      if (issues === null || unsafe0) {
        let result;

        try {
          result = cb0(output, options);
        } catch (error) {
          issues = concatIssues(issues, captureIssues(error));

          if (!options.verbose) {
            return issues;
          }
        }
        if (result != null) {
          issues = appendIssue(issues, result);

          if (issues !== null && !options.verbose) {
            return issues;
          }
        }
      }

      if (issues === null || unsafe1) {
        let result;

        try {
          result = cb1(output, options);
        } catch (error) {
          issues = concatIssues(issues, captureIssues(error));
        }
        if (result != null) {
          issues = appendIssue(issues, result);
        }
      }

      return issues;
    };
  }

  return (output, issues, options) => {
    for (let i = 0; i < checksLength; ++i) {
      const { unsafe, callback } = checks[i];

      let result;

      if (issues !== null && !unsafe) {
        continue;
      }

      try {
        result = callback(output, options);
      } catch (error) {
        issues = concatIssues(issues, captureIssues(error));

        if (!options.verbose) {
          return issues;
        }
      }

      if (result != null) {
        issues = appendIssue(issues, result);

        if (issues !== null && !options.verbose) {
          return issues;
        }
      }
    }

    return issues;
  };
}

function appendIssue(issues: Issue[] | null, result: Partial<Issue>[] | Partial<Issue>): Issue[] | null;

function appendIssue(issues: Issue[] | null, result: any): Issue[] | null {
  if (isArray(result)) {
    const resultLength = result.length;

    if (resultLength === 0) {
      return issues;
    }

    for (let i = 0; i < resultLength; ++i) {
      inflateIssue(result[i]);
    }

    if (issues === null) {
      issues = result;
    } else {
      issues.push(...result);
    }
  } else {
    inflateIssue(result);

    if (issues === null) {
      issues = [result];
    } else {
      issues.push(result);
    }
  }
  return issues;
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

export function returnFalse(): boolean {
  return false;
}

export function returnTrue(): boolean {
  return true;
}

export function returnArray(): [] {
  return [];
}
