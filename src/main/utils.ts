import { Check, CheckCallback, ConstraintOptions, Issue, Message, Ok, ParseOptions } from './shared-types';
import {
  AnyShape,
  ApplyChecksCallback,
  DeepPartialProtocol,
  DeepPartialShape,
  Result,
  Shape,
  ValueType,
} from './shapes/Shape';
import { inflateIssue, ValidationError } from './ValidationError';
import { TYPE_ARRAY, TYPE_DATE, TYPE_NULL, TYPE_OBJECT } from './constants';

export interface ReadonlyDict<T = any> {
  readonly [key: string]: T;
}

export interface Dict<T = any> {
  [key: string]: T;
}

export const isArray = Array.isArray;

export const { abs, floor, max } = Math;

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

const objectCtorString = Object.prototype.constructor.toString();

export function isPlainObject(value: any): boolean {
  let proto;
  let ctor;

  if (!isObjectLike(value)) {
    return false;
  }
  if ((proto = Object.getPrototypeOf(value)) === null) {
    return true;
  }
  if (!Object.hasOwnProperty.call(proto, 'constructor')) {
    return false;
  }
  if ((ctor = proto.constructor) === Object) {
    return true;
  }
  return isFunction(ctor) && Function.toString.call(ctor) === objectCtorString;
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

/**
 * A bitmask that can hold an arbitrary number of bits.
 */
export type Mask = number[] | number;

/**
 * Sets bit to 1 at index in mask.
 *
 * @param mask The mutable mask to update.
 * @param index The index at which the bit must be set to 1.
 * @returns The updated mask.
 */
export function enableMask(mask: Mask, index: number): Mask {
  if (typeof mask === 'number') {
    if (index < 32) {
      return mask | (1 << index);
    }
    mask = [mask, 0, 0];
  }

  mask[index >> 5] |= 1 << index % 32;

  return mask;
}

/**
 * Returns `true` if the bit at index in the bitmask is set to 1.
 */
export function isMaskEnabled(mask: Mask, index: number): boolean {
  if (typeof mask === 'number') {
    return mask >>> index !== 0;
  } else {
    return mask[index >> 5] >>> index % 32 !== 0;
  }
}

/**
 * Returns the extended value type.
 */
export function getValueType(value: unknown): Exclude<ValueType, 'any' | 'never'> {
  const type = typeof value;

  if (type !== TYPE_OBJECT) {
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

export function isAsyncShape(shape: AnyShape): boolean {
  return shape.isAsync;
}

export function isUnsafeCheck(check: Check): boolean {
  return check.isUnsafe;
}

/**
 * Converts the shape to its deep partial alternative if shape implements {@linkcode DeepPartialProtocol}, or returns
 * the shape as is.
 */
export function toDeepPartialShape<S extends AnyShape & Partial<DeepPartialProtocol<any>>>(
  shape: S
): DeepPartialShape<S> {
  return isFunction(shape.deepPartial) ? shape.deepPartial() : shape;
}

/**
 * The shortcut to add built-in constraints to shapes.
 */
export function addConstraint<S extends Shape>(
  shape: S,
  key: string,
  param: unknown,
  cb: CheckCallback<S['output']>
): S {
  return shape.check(cb, { key, param, unsafe: true });
}

/**
 * Replaces checks of the target shape with unsafe checks from the source shape.
 */
export function copyUnsafeChecks<S extends Shape>(sourceShape: AnyShape, targetShape: S): S {
  return copyChecks(sourceShape, targetShape, isUnsafeCheck);
}

/**
 * Replaces checks of the target shape with checks from the source shape that match a predicate.
 */
export function copyChecks<S extends Shape>(
  sourceShape: AnyShape,
  targetShape: S,
  predicate?: (check: Check) => boolean
): S {
  const checks = sourceShape['_checks'];

  return targetShape['_replaceChecks'](
    checks !== null && checks.length !== 0 && predicate !== undefined ? checks.filter(predicate) : []
  );
}

/**
 * Calls {@linkcode Shape._apply} or {@linkcode Shape._applyAsync} depending on {@linkcode Shape._isAsync}, and passes
 * the result to `cb` after it becomes available.
 */
export function applyForResult<T>(
  shape: AnyShape,
  input: unknown,
  options: ParseOptions,
  cb: (result: Result) => T
): T | Promise<Awaited<T>> {
  if (shape.isAsync) {
    return shape['_applyAsync'](input, options).then(cb) as Promise<Awaited<T>>;
  }
  return cb(shape['_apply'](input, options));
}

/**
 * Returns a function that creates a new array with a single issue.
 *
 * @param code The code of the issue.
 * @param defaultMessage The default message that is used if message isn't provided through options.
 * @param options Options provided by the user.
 * @param param The param that is added to the issue.
 * @returns The callback that takes an input and returns an array with a single issue.
 */
export function createIssueFactory(
  code: string,
  defaultMessage: string,
  options: ConstraintOptions | Message | undefined,
  param: unknown
): (input: unknown, options: Readonly<ParseOptions>) => Issue[];

/**
 * Returns a function that creates a new array with a single issue.
 *
 * @param code The code of the issue.
 * @param defaultMessage The default message that is used if message isn't provided through options.
 * @param options Options provided by the user.
 * @returns The callback that takes an input and a param, and returns an array with a single issue.
 */
export function createIssueFactory(
  code: string,
  defaultMessage: string,
  options: ConstraintOptions | Message | undefined
): (input: unknown, options: Readonly<ParseOptions>, param: unknown) => Issue[];

export function createIssueFactory(
  code: string,
  defaultMessage: any,
  options: any,
  param?: any
): (input: unknown, options: Readonly<ParseOptions>, param: unknown) => Issue[] {
  const paramRequired = arguments.length <= 3;

  let meta: unknown;
  let message = defaultMessage;

  if (isObjectLike(options)) {
    if (options.message !== undefined) {
      message = options.message;
    }
    meta = options.meta;
  } else if (isFunction(options)) {
    message = options;
  } else if (options !== undefined) {
    message = options;
  }

  if (isFunction(message)) {
    if (paramRequired) {
      return (input, options, param) => [
        { code, path: [], input, message: message(param, code, input, meta, options), param, meta },
      ];
    }

    return (input, options) => [
      { code, path: [], input, message: message(param, code, input, meta, options), param, meta },
    ];
  }

  if (typeof message === 'string') {
    if (paramRequired) {
      if (message.indexOf('%s') !== -1) {
        return (input, options, param) => [
          { code, path: [], input, message: message.replace('%s', String(param)), param, meta },
        ];
      }
    } else {
      message = message.replace('%s', String(param));
    }
  }

  if (paramRequired) {
    return (input, options, param) => [{ code, path: [], input, message, param, meta }];
  }

  return input => [{ code, path: [], input, message, param, meta }];
}

export function unshiftIssuesPath(issues: Issue[], key: unknown): void {
  for (const issue of issues) {
    issue.path.unshift(key);
  }
}

export function concatIssues(issues: Issue[] | null, result: Issue[]): Issue[] {
  if (issues === null) {
    return result;
  }
  issues.push(...result);
  return issues;
}

export function captureIssues(error: unknown): Issue[] {
  if (error instanceof ValidationError) {
    return error.issues;
  }
  throw error;
}

/**
 * Creates the callback that applies given checks to a value.
 */
export function createApplyChecksCallback(checks: readonly Check[]): ApplyChecksCallback | null {
  const checksLength = checks.length;

  if (checksLength === 0) {
    return null;
  }

  if (checksLength === 1) {
    const [{ isUnsafe: isUnsafe0, callback: cb0 }] = checks;

    return (output, issues, options) => {
      if (issues === null || isUnsafe0) {
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
    const [{ isUnsafe: isUnsafe0, callback: cb0 }, { isUnsafe: isUnsafe1, callback: cb1 }] = checks;

    return (output, issues, options) => {
      if (issues === null || isUnsafe0) {
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

      if (issues === null || isUnsafe1) {
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
      const { isUnsafe, callback } = checks[i];

      let result;

      if (issues !== null && !isUnsafe) {
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

function appendIssue(issues: Issue[] | null, result: any /*Partial<Issue>[] | Partial<Issue>*/): Issue[] | null {
  if (isArray(result)) {
    if (result.length === 0) {
      return issues;
    }

    result.forEach(inflateIssue);

    if (issues === null) {
      issues = result;
    } else {
      issues.push(...result);
    }
  } else if (isObjectLike(result)) {
    inflateIssue(result);

    if (issues === null) {
      issues = [result];
    } else {
      issues.push(result);
    }
  }
  return issues;
}
