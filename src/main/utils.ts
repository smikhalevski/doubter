import {
  ApplyChecksCallback,
  Check,
  CheckCallback,
  ConstraintOptions,
  Issue,
  Message,
  Ok,
  ReadonlyDict,
} from './shared-types';
import { AnyShape, Shape } from './shapes/Shape';
import { inflateIssue, ValidationError } from './ValidationError';

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export const isArray = Array.isArray;

export function isEqual(a: unknown, b: unknown): boolean {
  return a === b || (a !== a && b !== b);
}

export function isObjectLike(value: unknown): value is Record<any, any> {
  return value !== null && typeof value === 'object';
}

export function isAsyncShapes(shapes: readonly AnyShape[]): boolean {
  let async = false;

  for (let i = 0; i < shapes.length && !async; ++i) {
    async = shapes[i].async;
  }
  return async;
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

export function createIssueFactory(
  code: unknown,
  defaultMessage: unknown,
  options: ConstraintOptions | Message | undefined,
  param: unknown
): (input: unknown) => Issue;

export function createIssueFactory(
  code: unknown,
  defaultMessage: unknown,
  options: ConstraintOptions | Message | undefined
): (input: unknown, param: unknown) => Issue;

export function createIssueFactory(
  code: unknown,
  defaultMessage: any,
  options: ConstraintOptions | Message | undefined,
  param?: any
): (input: unknown, param: unknown) => Issue {
  const paramKnown = arguments.length === 4;

  let meta: unknown;
  let message = defaultMessage;

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
      return input => {
        return { code, path: [], input, message: message(param, code, input, meta), param, meta };
      };
    } else {
      return (input, param) => {
        return { code, path: [], input, message: message(param, code, input, meta), param, meta };
      };
    }
  }

  if (typeof message === 'string') {
    if (paramKnown) {
      message = message.replace('%s', param);
    } else if (message.indexOf('%s') !== -1) {
      return (input, param) => {
        return { code, path: [], input, message: message.replace('%s', param), param, meta };
      };
    }
  }

  if (paramKnown) {
    return input => {
      return { code, path: [], input, message, param, meta };
    };
  } else {
    return (input, param) => {
      return { code, path: [], input, message, param, meta };
    };
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

export function pushIssue(issues: Issue[] | null, result: Issue): Issue[] {
  if (issues !== null) {
    issues.push(result);
    return issues;
  }
  return [result];
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

export function createApplyChecksCallback(checks: Check[]): ApplyChecksCallback | null {
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
          result = cb0(output);
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
          result = cb0(output);
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
          result = cb1(output);
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
    for (let i = 1; i < checksLength; ++i) {
      const { unsafe, callback } = checks[i];

      let result;

      if (issues !== null && !unsafe) {
        continue;
      }

      try {
        result = callback(output);
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
