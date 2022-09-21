import {
  ConstraintsProcessor,
  Constraint,
  InputConstraintOptions,
  Issue,
  ObjectLike,
  OutputConstraintOptions,
  ParserOptions,
} from './shared-types';
import { ValidationError } from './ValidationError';
import type { AnyShape, Shape } from './shapes/Shape';
import { INVALID } from './shapes';

export function addConstraint<S extends Shape<any>>(
  shape: S,
  id: string | undefined | null,
  options: OutputConstraintOptions | string | undefined,
  constraint: Constraint<S['output']>
): S {
  return shape.constrain(constraint, { id, unsafe: isObjectLike(options) ? options.unsafe : false });
}

// -------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------

export function selectOutputArray(input: unknown[], output: unknown[]): unknown[] {
  const inputLength = input.length;

  for (let i = 0; i < inputLength; ++i) {
    if (!isEqual(input[i], output[i])) {
      return output;
    }
  }
  return input;
}

export function createFulfillArray(
  input: unknown[],
  options: ParserOptions | undefined,
  constraintsProcessor: ConstraintsProcessor<any> | null
): (output: unknown[], issues?: Issue[] | null) => any {
  return (output, issues = null) => {
    if (issues === null) {
      output = selectOutputArray(input, output);
    }
    if (constraintsProcessor !== null) {
      raiseIfIssues(constraintsProcessor(output, options, issues));
    }
    return output;
  };
}

export interface IssuesContext {
  issues: Issue[] | null;
}

export function createCatchForKey(
  key: unknown,
  options: ParserOptions | undefined,
  issuesContext: IssuesContext
): (error: unknown) => any {
  return error => {
    if (options !== undefined && options.fast && issuesContext.issues !== null) {
      return;
    }

    issuesContext.issues = raiseOrCaptureIssuesForKey(error, options, issuesContext.issues, key);
    return INVALID;
  };
}

export function createCatchForKey_OLD(key: unknown): (error: unknown) => never {
  return error => {
    raiseIfUnknownError(error);

    for (const issue of error.issues) {
      issue.path.unshift(key);
    }
    throw error;
  };
}

export function createProcessSettled(
  issues: Issue[] | null,
  callback: (values: unknown[], issues: Issue[] | null) => any
): (results: PromiseSettledResult<any>[]) => any {
  return results => {
    const resultsLength = results.length;

    for (let i = 0; i < resultsLength; ++i) {
      const result = results[i];

      if (result.status === 'fulfilled') {
        results[i] = result.value;
        continue;
      }

      // issues = captureIssuesForKey(issues, result.reason);
    }

    return callback(results, issues);
  };
}

export function captureIssues(issues: Issue[] | null, error: unknown): Issue[] {
  raiseIfUnknownError(error);

  const errorIssues = error.issues;

  if (issues !== null) {
    issues.push(...errorIssues);
    return issues;
  }
  return errorIssues;
}

export function captureIssuesForKey(issues: Issue[] | null, error: unknown, key: unknown): Issue[] {
  raiseIfUnknownError(error);

  const errorIssues = error.issues;

  for (const issue of errorIssues) {
    issue.path.unshift(key);
  }
  if (issues !== null) {
    issues.push(...errorIssues);
    return issues;
  }
  return errorIssues;
}

export function parseAsync<O>(shape: Shape<any, O>, input: unknown, options: ParserOptions | undefined): Promise<O> {
  return new Promise(resolve => resolve(shape.parse(input, options)));
}

export function isObjectLike(value: unknown): value is ObjectLike {
  return value !== null && typeof value === 'object';
}

export const isArray = Array.isArray;

export const isEqual = Object.is as <T>(value1: unknown, value2: T) => value1 is T;

export const isInteger = Number.isInteger as (value: unknown) => value is number;

export const isFinite = Number.isFinite as (value: unknown) => value is number;

export function isAsyncShapes(shapes: AnyShape[]): boolean {
  let async = false;

  for (let i = 0; i < shapes.length && !async; ++i) {
    async = shapes[i].async;
  }
  return async;
}

export function createApplyConstraints<T>(constraints: any[]): ConstraintsProcessor<T> | null {
  const constraintsLength = constraints.length;

  if (constraintsLength === 0) {
    return null;
  }

  if (constraintsLength === 3) {
    const [, unsafe0, callback0] = constraints;

    return (input, options, issues) => {
      if (issues === null || unsafe0) {
        try {
          callback0(input);
        } catch (error) {
          issues = raiseOrCaptureIssues(error, options, issues);
        }
      }
      return issues;
    };
  }

  if (constraintsLength === 6) {
    const [, unsafe0, callback0, , unsafe1, callback1] = constraints;

    return (input, options, issues) => {
      if (issues === null || unsafe0) {
        try {
          callback0(input);
        } catch (error) {
          issues = raiseOrCaptureIssues(error, options, issues);
        }
      }
      if (issues === null || unsafe1) {
        try {
          callback1(input);
        } catch (error) {
          issues = raiseOrCaptureIssues(error, options, issues);
        }
      }
      return issues;
    };
  }

  if (constraintsLength === 3) {
    const [, unsafe0, callback0, , unsafe1, callback1, , unsafe2, callback2] = constraints;

    return (input, options, issues) => {
      if (issues === null || unsafe0) {
        try {
          callback0(input);
        } catch (error) {
          issues = raiseOrCaptureIssues(error, options, issues);
        }
      }
      if (issues === null || unsafe1) {
        try {
          callback1(input);
        } catch (error) {
          issues = raiseOrCaptureIssues(error, options, issues);
        }
      }
      if (issues === null || unsafe2) {
        try {
          callback2(input);
        } catch (error) {
          issues = raiseOrCaptureIssues(error, options, issues);
        }
      }
      return issues;
    };
  }

  if (constraintsLength === 4) {
    const [, unsafe0, callback0, , unsafe1, callback1, , unsafe2, callback2, , unsafe3, callback3] = constraints;

    return (input, options, issues) => {
      if (issues === null || unsafe0) {
        try {
          callback0(input);
        } catch (error) {
          issues = raiseOrCaptureIssues(error, options, issues);
        }
      }
      if (issues === null || unsafe1) {
        try {
          callback1(input);
        } catch (error) {
          issues = raiseOrCaptureIssues(error, options, issues);
        }
      }
      if (issues === null || unsafe2) {
        try {
          callback2(input);
        } catch (error) {
          issues = raiseOrCaptureIssues(error, options, issues);
        }
      }
      if (issues === null || unsafe3) {
        try {
          callback3(input);
        } catch (error) {
          issues = raiseOrCaptureIssues(error, options, issues);
        }
      }
      return issues;
    };
  }

  return (input, options, issues) => {
    for (let i = 1; i < constraintsLength; i += 3) {
      if (issues === null || constraints[i]) {
        try {
          constraints[i + 1](input);
        } catch (error) {
          issues = raiseOrCaptureIssues(error, options, issues);
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
  options: InputConstraintOptions | string | undefined,
  message: string
): Issue {
  let meta;

  if (isObjectLike(options)) {
    if (options.message !== undefined) {
      message = options.message;
    }
    meta = options.meta;
  } else if (typeof options === 'string') {
    message = options;
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
  options: InputConstraintOptions | string | undefined,
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
  if (issues !== null && issues.length !== 0) {
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
