import {
  ApplyConstraints,
  Constraint,
  Dict,
  InputConstraintOptionsOrMessage,
  INVALID,
  Issue,
  IssueLike,
  OutputConstraintOptionsOrMessage,
  ParserOptions,
} from './shared-types';
import { ValidationError } from './ValidationError';
import type { AnyShape, Shape } from './shapes/Shape';

export function addConstraint<S extends Shape<any>>(
  shape: S,
  id: string | undefined,
  options: OutputConstraintOptionsOrMessage | undefined,
  constraint: Constraint<S['output']>
): S {
  return shape.constrain(constraint, {
    id,
    unsafe: options !== null && typeof options === 'object' ? options.unsafe : false,
  });
}

export function createResolveArray(
  input: unknown[],
  options: ParserOptions | undefined,
  context: IssuesContext,
  applyConstraints: ApplyConstraints | null
): (elements: unknown[]) => any {
  return elements => {
    const inputLength = input.length;

    let { issues } = context;
    let output = input;

    for (let i = 0; i < inputLength; ++i) {
      let outputValue = elements[i];

      if (isValidationError(outputValue)) {
        issues = captureIssuesForKey(outputValue, options, issues, i);

        if (isEarlyReturn(options)) {
          return outputValue;
        }
        output = elements;
        output[i] = INVALID;
        continue;
      }

      if (!isEqual(input[i], outputValue)) {
        output = elements;
      }
    }

    if (applyConstraints !== null) {
      issues = applyConstraints(output, options, issues);
    }

    return returnOrRaiseIssues(output, issues);
  };
}

/**
 * An internal context that is used during async parsing to share issues among parallel parser executions.
 */
export interface IssuesContext {
  issues: Issue[] | null;
}

export function createCatchForKey(
  key: unknown,
  options: ParserOptions | undefined,
  context: IssuesContext
): (error: unknown) => any {
  return error => {
    const { issues } = context;

    if (issues !== null && isEarlyReturn(options)) {
      throw new ValidationError(issues);
    }

    context.issues = throwOrCaptureIssuesForKey(error, options, issues, key);
    return INVALID;
  };
}

export function returnError(error: unknown): any {
  throwIfUnknownError(error);
  return error;
}

export function throwOrReturnIssues(error: unknown): Issue[] {
  throwIfUnknownError(error);
  return error.issues;
}

export function applySafeParseAsync<O>(
  shape: Shape<any, O>,
  input: unknown,
  options: ParserOptions | undefined
): Promise<O | ValidationError> {
  return new Promise(resolve => resolve(shape.safeParse(input, options)));
}

export function isObjectLike(value: unknown): value is Dict {
  return value != null && typeof value === 'object';
}

export function isValidationError(value: any): value is ValidationError {
  return value != null && value instanceof ValidationError;
}

export function isEarlyReturn(options: ParserOptions | undefined): boolean {
  return options == null || !options.verbose;
}

const positiveIntegerPattern = /^[1-9]\d*$/;

export function isArrayIndex(key: any): boolean {
  return (isInteger(key) && key >= 0) || key === '0' || (typeof key === 'string' && positiveIntegerPattern.test(key));
}

export function isTupleIndex(key: any, length: number): boolean {
  return isArrayIndex(key) && parseInt(key, 10) < length;
}

export const isArray = Array.isArray;

export const isEqual = Object.is;

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

    return (input, options, issues) => {
      if (issues === null || unsafe0) {
        let result: IssueLike | null = null;
        try {
          result = callback0(input, options);
        } catch (error) {
          return throwOrCaptureIssues(error, options, issues);
        }
        if (result != null) {
          issues = captureIssues(result, options, issues);
          if (issues !== null && isEarlyReturn(options)) {
            return issues;
          }
        }
      }
      return issues;
    };
  }

  if (constraintsLength === 6) {
    const [, unsafe0, callback0, , unsafe1, callback1] = constraints;

    return (input, options, issues) => {
      if (issues === null || unsafe0) {
        let result: IssueLike | null = null;
        try {
          result = callback0(input, options);
        } catch (error) {
          return throwOrCaptureIssues(error, options, issues);
        }
        if (result != null) {
          issues = captureIssues(result, options, issues);
          if (issues !== null && isEarlyReturn(options)) {
            return issues;
          }
        }
      }
      if (issues === null || unsafe1) {
        let result: IssueLike | null = null;
        try {
          result = callback1(input, options);
        } catch (error) {
          return throwOrCaptureIssues(error, options, issues);
        }
        if (result != null) {
          issues = captureIssues(result, options, issues);
          if (issues !== null && isEarlyReturn(options)) {
            return issues;
          }
        }
      }
      return issues;
    };
  }

  // if (constraintsLength === 3) {
  //   const [, unsafe0, callback0, , unsafe1, callback1, , unsafe2, callback2] = constraints;
  //
  //   return (input, options, issues) => {
  //     if (issues === null || unsafe0) {
  //       let error;
  //       try {
  //         error = callback0(input, options);
  //       } catch (error) {
  //         issues = throwOrCaptureIssues(error, options, issues);
  //       }
  //       if (error !== undefined) {
  //         issues = throwOrCaptureIssues(error, options, issues);
  //       }
  //     }
  //     if (issues === null || unsafe1) {
  //       let error;
  //       try {
  //         error = callback1(input, options);
  //       } catch (error) {
  //         issues = throwOrCaptureIssues(error, options, issues);
  //       }
  //       if (error !== undefined) {
  //         issues = throwOrCaptureIssues(error, options, issues);
  //       }
  //     }
  //     if (issues === null || unsafe2) {
  //       let error;
  //       try {
  //         error = callback2(input, options);
  //       } catch (error) {
  //         issues = throwOrCaptureIssues(error, options, issues);
  //       }
  //       if (error !== undefined) {
  //         issues = throwOrCaptureIssues(error, options, issues);
  //       }
  //     }
  //     return issues;
  //   };
  // }
  //
  // if (constraintsLength === 4) {
  //   const [, unsafe0, callback0, , unsafe1, callback1, , unsafe2, callback2, , unsafe3, callback3] = constraints;
  //
  //   return (input, options, issues) => {
  //     if (issues === null || unsafe0) {
  //       let error;
  //       try {
  //         error = callback0(input, options);
  //       } catch (error) {
  //         issues = throwOrCaptureIssues(error, options, issues);
  //       }
  //       if (error !== undefined) {
  //         issues = throwOrCaptureIssues(error, options, issues);
  //       }
  //     }
  //     if (issues === null || unsafe1) {
  //       let error;
  //       try {
  //         error = callback1(input, options);
  //       } catch (error) {
  //         issues = throwOrCaptureIssues(error, options, issues);
  //       }
  //       if (error !== undefined) {
  //         issues = throwOrCaptureIssues(error, options, issues);
  //       }
  //     }
  //     if (issues === null || unsafe2) {
  //       let error;
  //       try {
  //         error = callback2(input, options);
  //       } catch (error) {
  //         issues = throwOrCaptureIssues(error, options, issues);
  //       }
  //       if (error !== undefined) {
  //         issues = throwOrCaptureIssues(error, options, issues);
  //       }
  //     }
  //     if (issues === null || unsafe3) {
  //       let error;
  //       try {
  //         error = callback3(input, options);
  //       } catch (error) {
  //         issues = throwOrCaptureIssues(error, options, issues);
  //       }
  //       if (error !== undefined) {
  //         issues = throwOrCaptureIssues(error, options, issues);
  //       }
  //     }
  //     return issues;
  //   };
  // }

  return (input, options, issues) => {
    for (let i = 1; i < constraintsLength; i += 3) {
      if (issues === null || constraints[i]) {
        let result: IssueLike | null = null;
        try {
          result = constraints[i + 1](input, options);
        } catch (error) {
          return throwOrCaptureIssues(error, options, issues);
        }
        if (result != null) {
          issues = captureIssues(result, options, issues);
          if (issues !== null && isEarlyReturn(options)) {
            return issues;
          }
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

  if (options !== null && typeof options === 'object') {
    if (options.message !== undefined) {
      message = options.message;
    }
    meta = options.meta;
  } else if (typeof options === 'function') {
    message = options(param);
  } else {
    if (typeof options === 'string') {
      message = options;
    }
    message = message.replace('%s', param === undefined ? '' : String(param));
  }

  return { code, path: [], input, param, message, meta };
}

export function throwError(message: string): never {
  throw new Error(message);
}

export function raiseIssue(
  input: unknown,
  code: string,
  param: unknown,
  options: InputConstraintOptionsOrMessage | undefined,
  message: string
): ValidationError {
  return new ValidationError([createIssue(input, code, param, options, message)]);
}

export function throwIfUnknownError(error: unknown): asserts error is ValidationError {
  if (!isValidationError(error)) {
    throw error;
  }
}

export function returnOrRaiseIssues<T>(output: T, issues: Issue[] | null): T | ValidationError {
  return issues === null ? output : new ValidationError(issues);
}

export function throwOrCaptureIssues(
  error: unknown,
  options: ParserOptions | undefined,
  issues: Issue[] | null
): Issue[] | null {
  throwIfUnknownError(error);
  return captureIssues(error, options, issues);
}

export function captureIssues(
  error: IssueLike,
  options: ParserOptions | undefined,
  issues: Issue[] | null
): Issue[] | null {
  if (typeof error !== 'object') {
    return null;
  }

  if (isArray(error)) {
    if (error.length === 0) {
      return issues;
    }

    error.forEach(restoreIssue);

    if (issues !== null) {
      issues.push(...(error as Issue[]));
      return issues;
    }
    return error as Issue[];
  }

  if (isValidationError(error)) {
    const errorIssues = error.issues;

    if (issues !== null) {
      issues.push(...errorIssues);
      return issues;
    }
    return errorIssues;
  }

  const issue = restoreIssue(error);

  if (issues !== null) {
    issues.push(issue);
    return issues;
  }
  return [issue];
}

export function throwOrCaptureIssuesForKey(
  error: unknown,
  options: ParserOptions | undefined,
  issues: Issue[] | null,
  key: unknown
): Issue[] {
  throwIfUnknownError(error);
  return captureIssuesForKey(error, options, issues, key);
}

export function captureIssuesForKey(
  error: ValidationError,
  options: ParserOptions | undefined,
  issues: Issue[] | null,
  key: unknown
): Issue[] {
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

export function restoreIssue(issue: Partial<Issue>): Issue {
  issue.code ??= 'unknown';
  issue.path ??= [];

  return issue as Issue;
}
