import { TYPE_ARRAY, TYPE_DATE, TYPE_MAP, TYPE_NULL, TYPE_OBJECT, TYPE_PROMISE, TYPE_SET } from '../constants';
import {
  AnyShape,
  ApplyChecksCallback,
  DeepPartialProtocol,
  DeepPartialShape,
  Result,
  Shape,
  ValueType,
} from '../shapes/Shape';
import { ApplyOptions, Check, CheckCallback, ConstraintOptions, Issue, Message, Ok, ParseOptions } from '../types';
import { ValidationError } from '../ValidationError';
import { isArray, isObjectLike } from './lang';
import { cloneInstance } from './objects';

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
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
  if (value instanceof Promise) {
    return TYPE_PROMISE;
  }
  if (value instanceof Set) {
    return TYPE_SET;
  }
  if (value instanceof Map) {
    return TYPE_MAP;
  }
  return type;
}

export function isAsyncShape(shape: AnyShape): boolean {
  return shape.isAsync;
}

/**
 * Converts the shape to its deep partial alternative if shape implements {@linkcode DeepPartialProtocol}, or returns
 * the shape as is.
 */
export function toDeepPartialShape<S extends AnyShape & Partial<DeepPartialProtocol<any>>>(
  shape: S
): DeepPartialShape<S> {
  return typeof shape.deepPartial === 'function' ? shape.deepPartial() : shape;
}

export function isUnsafeCheck(check: Check): boolean {
  return check.isUnsafe;
}

/**
 * Returns the index of the check with the given key, or -1 if there's no such check.
 */
export function getCheckIndex(checks: readonly Check[], key: unknown): number {
  for (let i = 0; i < checks.length; ++i) {
    if (checks[i].key === key) {
      return i;
    }
  }
  return -1;
}

/**
 * Mutates the shape!
 *
 * Updates the shape checks and related properties.
 *
 * @param shape The shape to update.
 * @param checks The array of new checks.
 * @returns The clone of the shape.
 */
export function replaceChecks<S extends Shape>(shape: S, checks: readonly Check[]): S {
  shape['_checks'] = checks;
  shape['_applyChecks'] = createApplyChecksCallback(checks);
  shape['_isUnsafe'] = checks.some(isUnsafeCheck);

  return shape;
}

/**
 * The shortcut to add built-in checks to shapes.
 */
export function addCheck<S extends Shape, P>(shape: S, key: string, param: P, cb: CheckCallback<S['output'], P>): S {
  return shape.check({ key, unsafe: true }, cb, param);
}

/**
 * Replaces checks of the target shape with unsafe checks from the source shape.
 */
export function copyUnsafeChecks<S extends Shape>(sourceShape: Shape, targetShape: S): S {
  return copyChecks(sourceShape, targetShape, isUnsafeCheck);
}

/**
 * Replaces checks of `shape` with checks from the `baseShape` that match a predicate.
 */
export function copyChecks<S extends Shape>(baseShape: Shape, shape: S, predicate?: (check: Check) => boolean): S {
  const checks = baseShape['_checks'];

  return replaceChecks(
    cloneInstance(shape),
    checks.length !== 0 && predicate !== undefined ? checks.filter(predicate) : []
  );
}

/**
 * Calls `Shape._apply` or `Shape._applyAsync` depending on `Shape._isAsync`, and passes the result to `cb` after it
 * becomes available.
 */
export function applyShape<T>(
  shape: AnyShape,
  input: unknown,
  options: ApplyOptions,
  cb: (result: Result) => T
): T | Promise<Awaited<T>> {
  if (shape.isAsync) {
    return shape['_applyAsync'](input, options).then(cb) as Promise<Awaited<T>>;
  } else {
    return cb(shape['_apply'](input, options));
  }
}

/**
 * Prepends a key to a path of each issue.
 */
export function unshiftIssuesPath(issues: Issue[], key: unknown): void {
  for (const issue of issues) {
    if (isArray(issue.path)) {
      issue.path.unshift(key);
    } else {
      issue.path = [key];
    }
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
 * Returns a function that creates a new array with a single issue.
 *
 * @param code The code of the issue.
 * @param defaultMessage The default message that is used if message isn't provided through options.
 * @param options Options provided by the user.
 * @param param The param that is added to the issue.
 * @returns The callback that takes an input and options, and returns an array with a single issue.
 */
export function createIssueFactory(
  code: string,
  defaultMessage: string,
  options: ConstraintOptions | Message | undefined,
  param: unknown
): (input: unknown, options: Readonly<ApplyOptions>) => Issue[];

/**
 * Returns a function that creates a new array with a single issue.
 *
 * @param code The code of the issue.
 * @param defaultMessage The default message that is used if message isn't provided through options.
 * @param options Options provided by the user.
 * @returns The callback that takes an input, options, and a param, and returns an array with a single issue.
 */
export function createIssueFactory(
  code: string,
  defaultMessage: string,
  options: ConstraintOptions | Message | undefined
): (input: unknown, options: Readonly<ApplyOptions>, param: unknown) => Issue[];

export function createIssueFactory(
  code: string,
  defaultMessage: any,
  options: any,
  param?: unknown
): (input: unknown, options: Readonly<ApplyOptions>, param: unknown) => Issue[] {
  const paramRequired = arguments.length <= 3;

  let meta: unknown;
  let message = defaultMessage;

  if (isObjectLike(options)) {
    if (options.message !== undefined) {
      message = options.message;
    }
    meta = options.meta;
  } else if (typeof options === 'function') {
    message = options;
  } else if (options !== undefined) {
    message = options;
  }

  if (typeof message === 'function') {
    if (paramRequired) {
      return (input, options, param) => [
        { code, path: undefined, input, message: message(param, code, input, meta, options), param, meta },
      ];
    }

    return (input, options) => [
      { code, path: undefined, input, message: message(param, code, input, meta, options), param, meta },
    ];
  }

  if (typeof message === 'string') {
    if (paramRequired) {
      if (message.indexOf('%s') !== -1) {
        return (input, options, param) => [
          { code, path: undefined, input, message: message.replace('%s', String(param)), param, meta },
        ];
      }
    } else {
      message = message.replace('%s', String(param));
    }
  }

  if (paramRequired) {
    return (input, options, param) => [{ code, path: undefined, input, message, param, meta }];
  }

  return input => [{ code, path: undefined, input, message, param, meta }];
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
    const [{ callback: cb0, param: param0, isUnsafe: isUnsafe0 }] = checks;

    return (output, issues, options) => {
      if (issues === null || isUnsafe0) {
        let result;

        try {
          result = cb0(output, param0, options);
        } catch (error) {
          return concatIssues(issues, captureIssues(error));
        }
        if (result !== null && result !== undefined) {
          return appendIssue(issues, result);
        }
      }
      return issues;
    };
  }

  if (checksLength === 2) {
    const [
      { callback: cb0, param: param0, isUnsafe: isUnsafe0 },
      { callback: cb1, param: param1, isUnsafe: isUnsafe1 },
    ] = checks;

    return (output, issues, options) => {
      if (issues === null || isUnsafe0) {
        let result;

        try {
          result = cb0(output, param0, options);
        } catch (error) {
          issues = concatIssues(issues, captureIssues(error));

          if (!options.verbose) {
            return issues;
          }
        }
        if (result !== null && result !== undefined) {
          issues = appendIssue(issues, result);

          if (issues !== null && !options.verbose) {
            return issues;
          }
        }
      }

      if (issues === null || isUnsafe1) {
        let result;

        try {
          result = cb1(output, param1, options);
        } catch (error) {
          issues = concatIssues(issues, captureIssues(error));
        }
        if (result !== null && result !== undefined) {
          issues = appendIssue(issues, result);
        }
      }

      return issues;
    };
  }

  return (output, issues, options) => {
    for (let i = 0; i < checksLength; ++i) {
      const { callback, param, isUnsafe } = checks[i];

      let result;

      if (issues !== null && !isUnsafe) {
        continue;
      }

      try {
        result = callback(output, param, options);
      } catch (error) {
        issues = concatIssues(issues, captureIssues(error));

        if (!options.verbose) {
          return issues;
        }
      }

      if (result !== null && result !== undefined) {
        issues = appendIssue(issues, result);

        if (issues !== null && !options.verbose) {
          return issues;
        }
      }
    }

    return issues;
  };
}

function appendIssue(issues: Issue[] | null, result: Issue[] | Issue): Issue[] | null {
  if (isArray(result)) {
    if (result.length !== 0) {
      if (issues === null) {
        issues = result;
      } else {
        issues.push(...result);
      }
    }
  } else if (isObjectLike(result)) {
    if (issues === null) {
      issues = [result];
    } else {
      issues.push(result);
    }
  }
  return issues;
}

/**
 * Returns an error message that is composed of the captured issues and parsing options.
 */
export function getErrorMessage(
  issues: Issue[],
  input: unknown,
  options: ParseOptions | undefined
): string | undefined {
  if (!isObjectLike(options)) {
    return;
  }

  const { errorMessage } = options;

  if (typeof errorMessage === 'function') {
    return errorMessage(issues, input);
  }
  if (errorMessage !== undefined) {
    return String(errorMessage);
  }
}
