import { Constraint, ConstraintOptions, Dict, ParserOptions } from './shared-types';
import { ValidationError } from './ValidationError';
import type { AnyShape, Shape } from './shapes/Shape';

export function raiseUnknownError(error: unknown): asserts error is ValidationError {
  if (!(error instanceof ValidationError)) {
    throw error;
  }
}

export function returnNull(): null {
  return null;
}

export function catchError(error: unknown) {
  raiseUnknownError(error);
  return error.issues;
}

export const isArray = Array.isArray;

export const isEqual = Object.is as <T>(a: unknown, b: T) => a is T;

export const isInteger = Number.isInteger as (value: unknown) => value is number;

export const isFinite = Number.isFinite as (value: unknown) => value is number;

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

export function isEqualArray(a: any[], b: any[]): boolean {
  for (let i = 0; i < a.length; ++i) {
    if (!isEqual(a[i], b[i])) {
      return false;
    }
  }
  return true;
}

export interface PropertyDescriptor<T, V> {
  configurable?: boolean;
  enumerable?: boolean;
  value?: V;
  writable?: boolean;

  get?(this: T): V;

  set?(this: T, value: V): void;
}

export type Constructor<T> = new (...args: any[]) => T;

export function extendClass<T>(constructor: Constructor<T>, baseConstructor: Constructor<any>): T {
  const prototype = Object.create(baseConstructor.prototype);
  constructor.prototype = prototype;
  prototype.constructor = constructor;
  return prototype;
}

export const defineProperty: <T, P extends keyof T>(object: T, key: P, descriptor: PropertyDescriptor<T, T[P]>) => T =
  Object.defineProperty;

export function die(message: string): never {
  throw new Error(message);
}

export function dieAsyncParse(): never {
  die('Shape does not support synchronous parsing');
}

export function raiseError(error: Error | null): void {
  if (error !== null) {
    throw error;
  }
}

export function copyShape<S extends Shape<any>>(shape: S): any {
  const shapeCopy = Object.assign(Object.create(Object.getPrototypeOf(shape)), shape);
  shapeCopy.constraintIds = shapeCopy.constraintIds?.slice(0) || [];
  shapeCopy.constraints = shapeCopy.constraints?.slice(0) || [];
  return shapeCopy;
}

/**
 * Adds constraint to a shape.
 */
export function addConstraint<S extends Shape<any>>(
  shape: S,
  id: string | undefined,
  constraint: Constraint<S['output']>
): S {
  const shapeCopy = copyShape(shape);
  const { constraintIds, constraints } = shapeCopy;
  const i = constraintIds.indexOf(id);

  if (id == null || i === -1) {
    constraints.push(constraint);
    constraintIds.push(id);
  } else {
    constraints[i] = constraint;
  }
  return shapeCopy;
}

/**
 * Runs constraints against an input value and throws a validation error that contains captured issues.
 */
export function applyConstraints<T>(
  input: T,
  constraints: Constraint<T>[],
  parserOptions: ParserOptions | undefined,
  rootError: ValidationError | null
): ValidationError | null {
  const constraintsLength = constraints.length;

  try {
    constraints[0](input);
  } catch (error) {
    rootError = raiseOrCaptureIssues(error, rootError, parserOptions);
  }

  if (constraintsLength === 1) {
    return rootError;
  }

  try {
    constraints[1](input);
  } catch (error) {
    rootError = raiseOrCaptureIssues(error, rootError, parserOptions);
  }

  if (constraintsLength === 2) {
    return rootError;
  }

  try {
    constraints[2](input);
  } catch (error) {
    rootError = raiseOrCaptureIssues(error, rootError, parserOptions);
  }

  if (constraintsLength === 3) {
    return rootError;
  }

  try {
    constraints[3](input);
  } catch (error) {
    rootError = raiseOrCaptureIssues(error, rootError, parserOptions);
  }

  if (constraintsLength === 4) {
    return rootError;
  }

  for (let i = 4; i < constraintsLength; ++i) {
    try {
      constraints[i](input);
    } catch (error) {
      rootError = raiseOrCaptureIssues(error, rootError, parserOptions);
    }
  }
  return rootError;
}

export function raiseOrCaptureIssues(
  error: unknown,
  rootError: ValidationError | null,
  parserOptions: ParserOptions | undefined
): ValidationError {
  if (!(error instanceof ValidationError)) {
    throw error;
  }
  if (rootError !== null) {
    rootError.issues.push(...error.issues);
    return rootError;
  }
  if (parserOptions != null && parserOptions.fast) {
    throw error;
  }
  return new ValidationError(error.issues.slice(0));
}

export function raiseOrCaptureIssuesForKey(
  error: unknown,
  rootError: ValidationError | null,
  parserOptions: ParserOptions | undefined,
  key: unknown
): ValidationError {
  if (!(error instanceof ValidationError)) {
    throw error;
  }
  for (const issue of error.issues) {
    issue.path.unshift(key);
  }
  if (rootError !== null) {
    rootError.issues.push(...error.issues);
    return rootError;
  }
  if (parserOptions != null && parserOptions.fast) {
    throw error;
  }
  return new ValidationError(error.issues.slice(0));
}

/**
 * Raises a validation error with a single issue.
 */
export function raiseIssue(
  input: unknown,
  code: string,
  param: unknown,
  options: ConstraintOptions | string | undefined,
  message: string
): never {
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

  throw new ValidationError([{ code, path: [], input, param, message, meta }]);
}

export function createCatchForKey(key: unknown): (error: unknown) => never {
  return error => {
    if (error instanceof ValidationError) {
      for (const issue of error.issues) {
        issue.path.unshift(key);
      }
    }
    throw error;
  };
}

export function createExtractor(rootError: ValidationError | null): <T>(results: PromiseSettledResult<T>[]) => T[] {
  return results => {
    const values = [];

    for (let i = 0; i < results.length; ++i) {
      const result = results[i];

      if (result.status === 'fulfilled') {
        values.push(result.value);
        continue;
      }

      const error = result.reason;

      if (!(error instanceof ValidationError)) {
        throw error;
      }
      if (rootError !== null) {
        rootError.issues.push(...error.issues);
      } else {
        rootError = error;
      }
    }

    raiseError(rootError);
    return values;
  };
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
