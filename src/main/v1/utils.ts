import {
  Constraint,
  Dict,
  InputConstraintOptions,
  Issue,
  OutputConstraintOptions,
  ParserOptions,
} from './shared-types';
import { ValidationError } from './ValidationError';
import type { AnyShape, Shape } from './shapes/Shape';

export const isArray = Array.isArray;

export const isEqual = Object.is as <T>(a: unknown, b: T) => a is T;

export const isInteger = Number.isInteger as (value: unknown) => value is number;

export function isObjectLike(value: unknown): value is Dict {
  return value !== null && typeof value === 'object';
}

export function isAsync(shapes: Array<AnyShape>): boolean {
  let async = false;

  for (let i = 0; i < shapes.length && !async; ++i) {
    async = shapes[i].async;
  }
  return async;
}

export function returnOutputArray(input: any[], output: any[]): any[] {
  for (let i = 0; i < input.length; ++i) {
    if (!isEqual(input[i], output[i])) {
      return output;
    }
  }
  return input;
}

export function addConstraint<S extends Shape<any>>(
  shape: S,
  name: string | undefined,
  options: OutputConstraintOptions | string | undefined,
  constraint: Constraint<S['output']>
): S {
  return shape.constrain(constraint, { name, unsafe: typeof options === 'object' ? options.unsafe : false });
}

/**
 * Runs constraints against an input value and throws a validation error that contains captured issues.
 */
export function applyConstraints<T>(
  input: T,
  constraints: any[],
  options: ParserOptions | undefined,
  rootError: ValidationError
): ValidationError;

export function applyConstraints<T>(
  input: T,
  constraints: any[],
  options: ParserOptions | undefined,
  rootError: ValidationError | null
): ValidationError | null;

export function applyConstraints<T>(
  input: T,
  constraints: any[],
  options: ParserOptions | undefined,
  rootError: ValidationError | null
): ValidationError | null {
  const constraintsLength = constraints.length;

  if (rootError === null || constraints[1]) {
    try {
      constraints[2](input);
    } catch (error) {
      rootError = raiseOrCaptureIssues(error, rootError, options);
    }
  }
  if (constraintsLength === 3) {
    return rootError;
  }

  if (rootError === null || constraints[4]) {
    try {
      constraints[5](input);
    } catch (error) {
      rootError = raiseOrCaptureIssues(error, rootError, options);
    }
  }
  if (constraintsLength === 6) {
    return rootError;
  }

  for (let i = 7; i < constraintsLength; i += 3) {
    if (rootError === null || constraints[i].unsafe) {
      try {
        constraints[i + 1](input);
      } catch (error) {
        rootError = raiseOrCaptureIssues(error, rootError, options);
      }
    }
  }
  return rootError;
}

export function captureIssues(error: unknown): Issue[] {
  raiseOnUnknownError(error);
  return error.issues;
}

/**
 * Throws a fatal error.
 *
 * @param message The error message.
 */
export function raise(message: string): never {
  throw new Error(message);
}

/**
 * Asserts that an error is {@linkcode ValidationError}.
 *
 * @param error The error to assert.
 */
export function raiseOnUnknownError(error: unknown): asserts error is ValidationError {
  if (!(error instanceof ValidationError)) {
    throw error;
  }
}

/**
 * Throws an error if it isn't null.
 *
 * @param error An error to throw.
 */
export function raiseOnError(error: Error | null): void {
  if (error !== null) {
    throw error;
  }
}

/**
 * Adds issues from a validation error to a root error.
 */
export function raiseOrCaptureIssues(
  error: unknown,
  rootError: ValidationError | null,
  options: ParserOptions | undefined
): ValidationError {
  raiseOnUnknownError(error);

  if (rootError !== null) {
    rootError.issues.push(...error.issues);
    return rootError;
  }
  if (options != null && options.fast) {
    throw error;
  }
  return new ValidationError(error.issues.slice(0));
}

export function raiseOrCaptureIssuesForKey(
  error: unknown,
  rootError: ValidationError | null,
  options: ParserOptions | undefined,
  key: unknown
): ValidationError {
  raiseOnUnknownError(error);

  for (const issue of error.issues) {
    issue.path.unshift(key);
  }
  if (rootError !== null) {
    rootError.issues.push(...error.issues);
    return rootError;
  }
  if (options != null && options.fast) {
    throw error;
  }
  return new ValidationError(error.issues.slice(0));
}

/**
 * Raises a validation error with a single issue.
 */
export function createError(
  input: unknown,
  code: string,
  param: unknown,
  options: InputConstraintOptions | string | undefined,
  message: string
): ValidationError {
  let meta;

  if (options != null) {
    if (typeof options === 'string') {
      message = options;
    } else {
      if (options.message !== undefined) {
        message = options.message;
      }
      meta = options.meta;
    }
  }

  return new ValidationError([{ code, path: [], input, param, message, meta }]);
}

/**
 * Raises a validation error with a single issue.
 */
export function raiseIssue(
  input: unknown,
  code: string,
  param: unknown,
  options: InputConstraintOptions | string | undefined,
  message: string
): never {
  throw createError(input, code, param, options, message);
}

export function createCatchClauseForKey(key: unknown): (error: unknown) => never {
  return error => {
    raiseOnUnknownError(error);

    for (const issue of error.issues) {
      issue.path.unshift(key);
    }
    throw error;
  };
}

export function createOutputExtractor<T, R>(
  rootError: ValidationError | null,
  outputProcessor: (values: T[], rootError: ValidationError | null) => R
): (results: PromiseSettledResult<T>[]) => R {
  return results => {
    const values = [];

    for (let i = 0; i < results.length; ++i) {
      const result = results[i];

      if (result.status === 'fulfilled') {
        values.push(result.value);
        continue;
      }

      const error = result.reason;

      raiseOnUnknownError(error);

      if (rootError !== null) {
        rootError.issues.push(...error.issues);
      } else {
        rootError = error;
      }
    }

    return outputProcessor(values, rootError);
  };
}

export function pickDictKeys(input: Dict, keys: string[]): Dict {
  const output: Dict = {};

  for (const key of keys) {
    output[key] = input[key];
  }
  return output;
}

export function cloneDict(input: Dict): Dict {
  const output: Dict = {};

  for (const key in input) {
    output[key] = input[key];
  }
  return output;
}

export function cloneDictFirstKeys(input: Dict, keyCount: number): Dict {
  const output: Dict = {};
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
