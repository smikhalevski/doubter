import { ApplyChecksCallback, Check, CheckCallback, ConstraintOptions, Dict, Issue, Message, Ok } from './shared-types';
import { AnyShape, Shape } from './shapes/Shape';
import { inflateIssue, inflateIssues, ValidationError } from './ValidationError';

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

export type IssueFactory = (input: unknown) => Issue;

export function createIssueFactory(
  code: unknown,
  message: unknown,
  options: ConstraintOptions | Message | undefined,
  param?: unknown
): IssueFactory {
  let meta: unknown;

  if (options !== null && typeof options === 'object') {
    if (options.message !== undefined) {
      message = options.message;
    }
    meta = options.meta;
  } else if (typeof options === 'function') {
    message = options;
  } else if (options != null) {
    message = String(options);
  }

  if (typeof message === 'string') {
    message = message.replace('%s', String(param));
  }

  return input => {
    return {
      code,
      path: [],
      input,
      message,
      param,
      meta,
    };
  };
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

export function appendPartialIssue(issues: Issue[] | null, issue: Partial<Issue>[] | Partial<Issue>): Issue[] {
  if (isArray(issue)) {
    if (issues === null) {
      issues = inflateIssues(issue);
    } else {
      issues.push(...inflateIssues(issue));
    }
  } else {
    if (issues === null) {
      issues = [inflateIssue(issue)];
    } else {
      issues.push(inflateIssue(issue));
    }
  }
  return issues;
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

export function cloneEnumerableKeys(input: Dict, keyCount = -1): Dict {
  const output: Dict = {};

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

export function cloneKnownKeys(input: Dict, keys: readonly string[]): Dict {
  const output: Dict = {};
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
          return appendPartialIssue(issues, result);
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
          issues = appendPartialIssue(issues, result);

          if (!options.verbose) {
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
          issues = appendPartialIssue(issues, result);
        }
      }

      return issues;
    };
  }

  return (output, issues, options) => {
    for (let i = 1; i < checksLength; ++i) {
      const { unsafe, callback: cb } = checks[i];

      let result;

      if (issues !== null && !unsafe) {
        continue;
      }

      try {
        result = cb(output);
      } catch (error) {
        issues = concatIssues(issues, captureIssues(error));

        if (!options.verbose) {
          return issues;
        }
      }

      if (result != null) {
        issues = appendPartialIssue(issues, result);

        if (!options.verbose) {
          return issues;
        }
      }
    }

    return issues;
  };
}
