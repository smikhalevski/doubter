import { ConstraintOptions, ParserOptions } from './shared-types';
import { ValidationError } from '../ValidationError';
import type { Constraint, Shape } from './Shape';

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

/**
 * Adds constraint to a shape.
 */
export function addConstraint<S extends Shape<any>>(
  shape: S,
  id: string | undefined,
  constraint: Constraint<S['output']>
): S {
  const shapeCopy = Object.assign(Object.create(Object.getPrototypeOf(shape)), shape);
  const constraintIds = (shapeCopy.constraintIds = shapeCopy.constraintIds.slice(0));
  const constraints = (shapeCopy.constraints = shapeCopy.constraints.slice(0));
  const i = constraintIds.indexOf(id);

  if (id == null || i === -1) {
    constraintIds[constraints.push(constraint)] = id;
  } else {
    constraints[i] = constraint;
  }
  return shape;
}

/**
 * Runs constraints against an input value and throws a validation error that contains captured issues.
 */
export function applyConstraints<T>(
  input: T,
  constraints: Constraint<T>[],
  parserOptions: ParserOptions | undefined
): void {
  let rootError: ValidationError | undefined;

  const constraintsLength = constraints.length;

  if (constraintsLength === 1) {
    constraints[0](input);
    return;
  }

  if (constraintsLength === 2) {
    try {
      constraints[0](input);
    } catch (error) {
      rootError = raiseOrCaptureError(error, rootError, parserOptions);
    }
    try {
      constraints[1](input);
    } catch (error) {
      rootError = raiseOrCaptureError(error, rootError, parserOptions);
    }
    if (rootError !== undefined) {
      throw rootError;
    }
    return;
  }

  if (constraintsLength === 3) {
    try {
      constraints[0](input);
    } catch (error) {
      rootError = raiseOrCaptureError(error, rootError, parserOptions);
    }
    try {
      constraints[1](input);
    } catch (error) {
      rootError = raiseOrCaptureError(error, rootError, parserOptions);
    }
    try {
      constraints[2](input);
    } catch (error) {
      rootError = raiseOrCaptureError(error, rootError, parserOptions);
    }
    if (rootError !== undefined) {
      throw rootError;
    }
    return;
  }

  for (const constraint of constraints) {
    try {
      constraint(input);
    } catch (error) {
      rootError = raiseOrCaptureError(error, rootError, parserOptions);
    }
  }
  if (rootError !== undefined) {
    throw rootError;
  }
}

function raiseOrCaptureError(
  error: unknown,
  rootError: ValidationError | undefined,
  parserOptions: ParserOptions | undefined
): ValidationError {
  if (!(error instanceof ValidationError)) {
    throw error;
  }
  if (rootError !== undefined) {
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
