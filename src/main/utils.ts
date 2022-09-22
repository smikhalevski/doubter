import {
  ApplyConstraints,
  Constraint,
  Dict,
  InputConstraintOptionsOrMessage,
  INVALID,
  Issue,
  OutputConstraintOptionsOrMessage,
  ParserOptions,
} from './shared-types';
import { ValidationError } from './ValidationError';
import type { AnyShape, Shape } from './shapes/Shape';

export function addConstraint<S extends Shape<any>>(
  shape: S,
  id: string | undefined | null,
  options: OutputConstraintOptionsOrMessage | undefined,
  constraint: Constraint<S['output']>
): S {
  return shape.constrain(constraint, { id, unsafe: isObjectLike(options) ? options.unsafe : false });
}

export function createResolveArray(
  input: unknown[],
  options: ParserOptions | undefined,
  context: ParserContext,
  applyConstraints: ApplyConstraints | null
): (elements: unknown[]) => any {
  return elements => {
    const inputLength = input.length;

    let output = input;

    for (let i = 0; i < inputLength; ++i) {
      if (!isEqual(input[i], elements[i])) {
        output = elements;
      }
    }

    let { issues } = context;
    if (applyConstraints !== null) {
      issues = applyConstraints(output, options, issues);
    }
    raiseIfIssues(issues);

    return output;
  };
}

export interface ParserContext {
  issues: Issue[] | null;
}

export function createCatchForKey(
  key: unknown,
  options: ParserOptions | undefined,
  context: ParserContext
): (error: unknown) => any {
  return error => {
    const { issues } = context;

    if (options !== undefined && options.fast && issues !== null) {
      raiseIfIssues(issues);
    }

    context.issues = raiseOrCaptureIssuesForKey(error, options, issues, key);
    return INVALID;
  };
}

export function captureIssues(error: unknown): Issue[] {
  raiseIfUnknownError(error);
  return error.issues;
}

export function parseAsync<O>(shape: Shape<any, O>, input: unknown, options: ParserOptions | undefined): Promise<O> {
  return new Promise(resolve => resolve(shape.parse(input, options)));
}

export function isObjectLike(value: unknown): value is Dict {
  return value !== null && typeof value === 'object';
}

const positiveIntegerPattern = /^[1-9]\d*$/;

export function isArrayIndex(key: any): boolean {
  return (isInteger(key) && key >= 0) || key === '0' || (typeof key === 'string' && positiveIntegerPattern.test(key));
}

export function isTupleIndex(key: any, length: number): boolean {
  return isArrayIndex(key) && parseInt(key, 10) < length;
}

export const isArray = Array.isArray;

export const isEqual = Object.is as <T>(value1: unknown, value2: T) => value1 is T;

export const isInteger = Number.isInteger as (value: unknown) => value is number;

export const isFinite = Number.isFinite as (value: unknown) => value is number;

export function isAsyncShapes(shapes: readonly AnyShape[]): boolean {
  let async = false;

  for (let i = 0; i < shapes.length && !async; ++i) {
    async = shapes[i].async;
  }
  return async;
}

export function createApplyConstraints(constraints: any[]): ApplyConstraints | null {
  const constraintsLength = constraints.length;

  if (constraintsLength === 0) {
    return null;
  }

  if (constraintsLength === 3) {
    const [, unsafe0, callback0] = constraints;

    return (input, parserOptions, issues) => {
      if (issues === null || unsafe0) {
        try {
          callback0(input, parserOptions);
        } catch (error) {
          issues = raiseOrCaptureIssues(error, parserOptions, issues);
        }
      }
      return issues;
    };
  }

  if (constraintsLength === 6) {
    const [, unsafe0, callback0, , unsafe1, callback1] = constraints;

    return (input, parserOptions, issues) => {
      if (issues === null || unsafe0) {
        try {
          callback0(input, parserOptions);
        } catch (error) {
          issues = raiseOrCaptureIssues(error, parserOptions, issues);
        }
      }
      if (issues === null || unsafe1) {
        try {
          callback1(input, parserOptions);
        } catch (error) {
          issues = raiseOrCaptureIssues(error, parserOptions, issues);
        }
      }
      return issues;
    };
  }

  if (constraintsLength === 3) {
    const [, unsafe0, callback0, , unsafe1, callback1, , unsafe2, callback2] = constraints;

    return (input, parserOptions, issues) => {
      if (issues === null || unsafe0) {
        try {
          callback0(input, parserOptions);
        } catch (error) {
          issues = raiseOrCaptureIssues(error, parserOptions, issues);
        }
      }
      if (issues === null || unsafe1) {
        try {
          callback1(input, parserOptions);
        } catch (error) {
          issues = raiseOrCaptureIssues(error, parserOptions, issues);
        }
      }
      if (issues === null || unsafe2) {
        try {
          callback2(input, parserOptions);
        } catch (error) {
          issues = raiseOrCaptureIssues(error, parserOptions, issues);
        }
      }
      return issues;
    };
  }

  if (constraintsLength === 4) {
    const [, unsafe0, callback0, , unsafe1, callback1, , unsafe2, callback2, , unsafe3, callback3] = constraints;

    return (input, parserOptions, issues) => {
      if (issues === null || unsafe0) {
        try {
          callback0(input, parserOptions);
        } catch (error) {
          issues = raiseOrCaptureIssues(error, parserOptions, issues);
        }
      }
      if (issues === null || unsafe1) {
        try {
          callback1(input, parserOptions);
        } catch (error) {
          issues = raiseOrCaptureIssues(error, parserOptions, issues);
        }
      }
      if (issues === null || unsafe2) {
        try {
          callback2(input, parserOptions);
        } catch (error) {
          issues = raiseOrCaptureIssues(error, parserOptions, issues);
        }
      }
      if (issues === null || unsafe3) {
        try {
          callback3(input, parserOptions);
        } catch (error) {
          issues = raiseOrCaptureIssues(error, parserOptions, issues);
        }
      }
      return issues;
    };
  }

  return (input, parserOptions, issues) => {
    for (let i = 1; i < constraintsLength; i += 3) {
      if (issues === null || constraints[i]) {
        try {
          constraints[i + 1](input, parserOptions);
        } catch (error) {
          issues = raiseOrCaptureIssues(error, parserOptions, issues);
        }
      }
    }
    return issues;
  };
}

export function createIssue(
  input: unknown,
  code: string,
  param: unknown,
  options: InputConstraintOptionsOrMessage | undefined,
  message: string
): Issue {
  let meta;

  if (isObjectLike(options)) {
    if (options.message !== undefined) {
      message = options.message;
    }
    meta = options.meta;
  } else if (typeof options === 'string') {
    message = options.replace('%s', String(param));
  }

  return { code, path: [], input, param, message, meta };
}

export function raise(message: string): never {
  throw new Error(message);
}

export function raiseIssue(
  input: unknown,
  code: string,
  param: unknown,
  options: InputConstraintOptionsOrMessage | undefined,
  message: string
): never {
  throw new ValidationError([createIssue(input, code, param, options, message)]);
}

export function raiseIfUnknownError(error: unknown): asserts error is ValidationError {
  if (!(error instanceof ValidationError)) {
    throw error;
  }
}

export function raiseIfIssues(issues: Issue[] | null): void {
  if (issues !== null) {
    throw new ValidationError(issues);
  }
}

export function raiseOrCaptureIssues(
  error: unknown,
  options: ParserOptions | undefined,
  issues: Issue[] | null
): Issue[] {
  raiseIfUnknownError(error);

  const errorIssues = error.issues;

  if (issues !== null) {
    issues.push(...errorIssues);
    return issues;
  }
  if (options !== undefined && options.fast) {
    throw error;
  }
  return errorIssues;
}

export function raiseOrCaptureIssuesForKey(
  error: unknown,
  options: ParserOptions | undefined,
  issues: Issue[] | null,
  key: unknown
): Issue[] {
  raiseIfUnknownError(error);

  const errorIssues = error.issues;

  for (const issue of errorIssues) {
    issue.path.unshift(key);
  }
  if (issues !== null) {
    issues.push(...errorIssues);
    return issues;
  }
  if (options !== undefined && options.fast) {
    throw error;
  }
  return errorIssues;
}
