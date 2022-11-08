import { CheckCallback, ConstraintOptions, Dict, Issue, Message, Ok } from './shared-types';
import { AnyShape, Shape } from './shapes/Shape';
import { ValidationError } from './ValidationError';

export const isEqual = Object.is;

export const isArray = Array.isArray;

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
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
export function addCheck<S extends Shape>(
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

export function isObjectLike(value: unknown): value is Record<any, any> {
  return value !== null && typeof value === 'object';
}

export function createIssueFactory(
  options: ConstraintOptions | Message | undefined,
  code: unknown,
  message: unknown,
  param?: unknown
): (input: unknown, p?: unknown) => Issue {
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

  return (input, p) => {
    return {
      code,
      path: [],
      input,
      message,
      param: p === undefined ? param : p,
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

export function assignProperty(obj: Record<any, any>, key: PropertyKey, value: unknown): void {
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
      assignProperty(output, key, input[key]);
    }
  }
  if (keyCount > 0) {
    let index = 0;

    for (const key in input) {
      if (index === keyCount) {
        break;
      }
      assignProperty(output, key, input[key]);
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
      assignProperty(output, key, input[key]);
    }
  }
  return output;
}

export function captureIssues(error: unknown): Issue[] {
  if (error instanceof ValidationError) {
    return error.issues;
  }
  throw error;
}

export function addIssue(issues: Issue[] | null, issue: Issue[] | Issue): Issue[] {
  if (isArray(issue)) {
    if (issues === null) {
      issues = issue;
    } else {
      issues.push(...issue);
    }
  } else {
    if (issues === null) {
      issues = [issue];
    } else {
      issues.push(issue);
    }
  }
  return issues;
}
