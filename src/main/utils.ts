import { ValidationError } from './ValidationError';
import { ConstraintOptions, Dict, Issue, ParserOptions } from './shared-types';
import { AnyType } from '../main';

export function raiseIssue(
  input: unknown,
  code: string,
  param: unknown,
  options: ConstraintOptions | undefined,
  message: string
): never {
  raiseIssuesIfDefined([
    {
      code,
      path: [],
      input,
      param,
      message: options?.message ?? message,
      meta: options?.meta,
    },
  ]);
}

export function raiseIssuesOrPush(
  issues: Issue[] = [],
  parserOptions: ParserOptions | undefined,
  input: unknown,
  code: string,
  param: unknown,
  options: ConstraintOptions | undefined,
  message: string
): Issue[] {
  issues.push({
    code,
    path: [],
    input,
    param,
    message: options?.message ?? message,
    meta: options?.meta,
  });

  if (parserOptions?.fast) {
    raiseIssuesIfDefined(issues);
  }
  return issues;
}

export function raiseIssuesIfDefined(issues: Issue[]): never;

export function raiseIssuesIfDefined(issues: Issue[] | undefined): void;

export function raiseIssuesIfDefined(issues: Issue[] | undefined): void {
  if (issues !== undefined) {
    throw new ValidationError(issues);
  }
}

export function raiseIssuesOrCaptureForKey(
  error: unknown,
  issues: Issue[] | undefined,
  parserOptions: ParserOptions | undefined,
  key: unknown
): Issue[] {
  if (error instanceof ValidationError) {
    for (const issue of error.issues) {
      issue.path.unshift(key);
    }
  }

  if (isFast(parserOptions) || !(error instanceof ValidationError)) {
    throw error;
  }
  if (issues !== undefined) {
    issues.push(...error.issues);
    return issues;
  }
  return error.issues;
}

export function cloneObject<T extends object>(value: T): T {
  return Object.assign(Object.create(Object.getPrototypeOf(value)), value);
}

export function isObjectLike(value: unknown): value is Dict {
  return value !== null && typeof value === 'object';
}

export function createCatchForKey(key: unknown) {
  return (error: unknown) => {
    if (error instanceof ValidationError) {
      for (const issue of error.issues) {
        issue.path.unshift(key);
      }
    }
    throw error;
  };
}

export function createValuesExtractor(issues?: Issue[]) {
  return <T>(results: PromiseSettledResult<T>[]): T[] => {
    for (let i = 0; i < results.length; ++i) {
      const result = results[i];

      if (result.status === 'rejected') {
        const error = result.reason;
        if (!(error instanceof ValidationError)) {
          throw error;
        }
        if (issues === undefined) {
          issues = error.issues;
        } else {
          issues.push(...error.issues);
        }
      }
    }
    if (issues !== undefined) {
      throw new ValidationError(issues);
    }

    const values = [];
    for (let i = 0; i < results.length; ++i) {
      values.push((results[i] as any).value);
    }
    return values;
  };
}

export function isFast(options: ParserOptions | undefined): boolean {
  return options !== undefined && options.fast === true;
}

export function isAsync(types: Array<AnyType>): boolean {
  let async = false;

  for (let i = 0; i < types.length && !async; ++i) {
    async = types[i].async;
  }
  return async;
}

export const isEqual = Object.is;

export const isArray = Array.isArray;

export const isInteger = Number.isInteger;

export const promiseAll = Promise.all.bind(Promise);

export const promiseAllSettled = Promise.allSettled.bind(Promise);

export function parseAsync(type: AnyType, input: any, options: ParserOptions | undefined): Promise<any> {
  return type.async ? type.parse(input, options) : Promise.resolve().then(() => type.parse(input, options));
}

export function isEqualArray(a: any[], b: any[]): boolean {
  for (let i = 0; i < a.length; ++i) {
    if (!isEqual(a[i], b[i])) {
      return false;
    }
  }
  return true;
}

export function returnNull() {
  return null;
}

export function extractIssues(error: unknown) {
  if (error instanceof ValidationError) {
    return error.issues;
  }
  throw error;
}

export function copyObjectKnownKeys(input: Dict, keys: string[]): Dict {
  const output: Dict = {};

  for (const key of keys) {
    output[key] = input[key];
  }
  return output;
}

export function copyObjectEnumerableKeys(input: Dict, keyCount?: number): Dict {
  const output: Dict = {};

  if (keyCount === undefined) {
    for (const key in input) {
      output[key] = input[key];
    }
    return output;
  }

  let i = 0;

  for (const key in input) {
    if (i >= keyCount) {
      break;
    }
    output[key] = input[key];
    i++;
  }
  return output;
}
