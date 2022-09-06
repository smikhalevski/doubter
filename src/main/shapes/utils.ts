import { ConstraintOptions, ParserOptions } from './shared-types';
import { ValidationError } from '../ValidationError';
import type { Constraint, Shape } from './Shape';

export const isArray = Array.isArray;

export const isInteger = Number.isInteger;

export const isEqual = Object.is;

export const promiseAll = Promise.all.bind(Promise);

export const promiseAllSettled = Promise.allSettled.bind(Promise);

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

export function dieError(error: Error | null): void {
  if (error !== null) {
    throw error;
  }
}

/**
 * Adds constraint to a shape.
 */
export function addConstraint<S extends Shape<any>>(
  shape: S,
  id: string | undefined,
  constraint: Constraint<S['output']>
): S {
  const shapeCopy = Object.assign(Object.create(Object.getPrototypeOf(shape)), shape);
  const constraintIds = (shapeCopy.constraintIds = shapeCopy.constraintIds?.slice(0) || []);
  const constraints = (shapeCopy.constraints = shapeCopy.constraints?.slice(0) || []);
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
    rootError = raiseOrCaptureError(error, rootError, parserOptions);
  }

  if (constraintsLength === 1) {
    return rootError;
  }

  try {
    constraints[1](input);
  } catch (error) {
    rootError = raiseOrCaptureError(error, rootError, parserOptions);
  }

  if (constraintsLength === 2) {
    return rootError;
  }

  try {
    constraints[2](input);
  } catch (error) {
    rootError = raiseOrCaptureError(error, rootError, parserOptions);
  }

  if (constraintsLength === 3) {
    return rootError;
  }

  try {
    constraints[3](input);
  } catch (error) {
    rootError = raiseOrCaptureError(error, rootError, parserOptions);
  }

  if (constraintsLength === 4) {
    return rootError;
  }

  for (let i = 4; i < constraintsLength; ++i) {
    try {
      constraints[i](input);
    } catch (error) {
      rootError = raiseOrCaptureError(error, rootError, parserOptions);
    }
  }
  return rootError;
}

// export function applyConstraints<T>(
//   input: T,
//   constraints: Constraint<T>[],
//   parserOptions: ParserOptions | undefined,
//   rootError: ValidationError | null
// ): ValidationError | null {
//   const constraintsLength = constraints.length;
//
//   try {
//     constraints[0](input);
//   } catch (error) {
//     rootError = raiseOrCaptureError(error, rootError, parserOptions);
//   }
//
//   if (constraintsLength === 1) {
//     return rootError;
//   }
//
//   try {
//     constraints[1](input);
//   } catch (error) {
//     rootError = raiseOrCaptureError(error, rootError, parserOptions);
//   }
//
//   if (constraintsLength === 2) {
//     return rootError;
//   }
//
//   try {
//     constraints[2](input);
//   } catch (error) {
//     rootError = raiseOrCaptureError(error, rootError, parserOptions);
//   }
//
//   if (constraintsLength === 3) {
//     return rootError;
//   }
//
//   try {
//     constraints[3](input);
//   } catch (error) {
//     rootError = raiseOrCaptureError(error, rootError, parserOptions);
//   }
//
//   if (constraintsLength === 4) {
//     return rootError;
//   }
//
//   for (let i = 4; i < constraintsLength; ++i) {
//     try {
//       constraints[i](input);
//     } catch (error) {
//       rootError = raiseOrCaptureError(error, rootError, parserOptions);
//     }
//   }
//   return rootError;
// }

export function raiseOrCaptureError(
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

/**
 * Raises a validation error with a single issue.
 */
export function raiseError(
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

export function createSettledResultExtractor(
  rootError: ValidationError | null
): <T>(results: PromiseSettledResult<T>[]) => T[] {
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

    dieError(rootError);
    return values;
  };
}
