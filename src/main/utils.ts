import {
  ApplyConstraints,
  Constraint,
  InputConstraintOptionsOrMessage,
  INVALID,
  Issue,
  OutputConstraintOptionsOrMessage,
  ParserOptions,
} from './shared-types';
import { createValidationError, inflateIssue, isValidationError, ValidationError } from './ValidationError';
import type { AnyShape, Shape } from './shapes/Shape';
import { isArray, isEqual, isInteger } from './lang-utils';

/**
 * Returns `true` if parsing should be aborted after the first issue was encountered.
 */
export function isEarlyReturn(options: ParserOptions | undefined): boolean {
  return options == null || !options.verbose;
}

/**
 * The convenient shortcut to add built-in constraints to shapes.
 */
export function appendConstraint<S extends Shape>(
  shape: S,
  id: string | undefined,
  options: OutputConstraintOptionsOrMessage | undefined,
  constraint: Constraint<S['output']>
): S {
  const unsafe = options != null && typeof options === 'object' ? options.unsafe : false;

  return shape.constrain(constraint, { id, unsafe });
}

/**
 * Creates an optimized callback that applies constraints to a value, or returns `null` if there are no constraints.
 */
export function createApplyConstraints(constraints: any[]): ApplyConstraints | null {
  const constraintsLength = constraints.length;

  if (constraintsLength === 0) {
    return null;
  }

  if (constraintsLength === 3) {
    const [, unsafe0, callback0] = constraints;

    return (input, options, issues) => {
      let result = null;

      if (issues === null || unsafe0) {
        try {
          result = callback0(input, options);
        } catch (error) {
          return throwOrCaptureIssues(error, options, issues);
        }

        if (result != null) {
          issues = captureConstraintIssues(result, options, issues);
        }
      }

      return issues;
    };
  }

  if (constraintsLength === 6) {
    const [, unsafe0, callback0, , unsafe1, callback1] = constraints;

    return (input, options, issues) => {
      let result = null;

      if (issues === null || unsafe0) {
        try {
          result = callback0(input, options);
        } catch (error) {
          return throwOrCaptureIssues(error, options, issues);
        }

        if (result != null) {
          issues = captureConstraintIssues(result, options, issues);

          if (issues !== null && isEarlyReturn(options)) {
            return issues;
          }
        }
      }

      if (issues === null || unsafe1) {
        try {
          result = callback1(input, options);
        } catch (error) {
          return throwOrCaptureIssues(error, options, issues);
        }

        if (result != null) {
          issues = captureConstraintIssues(result, options, issues);
        }
      }

      return issues;
    };
  }

  if (constraintsLength === 9) {
    const [, unsafe0, callback0, , unsafe1, callback1, , unsafe2, callback2] = constraints;

    return (input, options, issues) => {
      let result = null;

      if (issues === null || unsafe0) {
        try {
          result = callback0(input, options);
        } catch (error) {
          return throwOrCaptureIssues(error, options, issues);
        }

        if (result != null) {
          issues = captureConstraintIssues(result, options, issues);

          if (issues !== null && isEarlyReturn(options)) {
            return issues;
          }
        }
      }

      if (issues === null || unsafe1) {
        try {
          result = callback1(input, options);
        } catch (error) {
          return throwOrCaptureIssues(error, options, issues);
        }

        if (result != null) {
          issues = captureConstraintIssues(result, options, issues);

          if (issues !== null && isEarlyReturn(options)) {
            return issues;
          }
        }
      }

      if (issues === null || unsafe2) {
        try {
          result = callback2(input, options);
        } catch (error) {
          return throwOrCaptureIssues(error, options, issues);
        }

        if (result != null) {
          issues = captureConstraintIssues(result, options, issues);
        }
      }

      return issues;
    };
  }

  return (input, options, issues) => {
    let result = null;

    for (let i = 1; i < constraintsLength; i += 3) {
      if (issues === null || constraints[i]) {
        try {
          result = constraints[i + 1](input, options);
        } catch (error) {
          return throwOrCaptureIssues(error, options, issues);
        }

        if (result != null) {
          issues = captureConstraintIssues(result, options, issues);

          if (issues !== null && isEarlyReturn(options)) {
            return issues;
          }
        }
      }
    }

    return issues;
  };
}

/**
 * Takes result returned from the constraint and interprets it as issues.
 */
function captureConstraintIssues(
  result: any,
  options: ParserOptions | undefined,
  issues: Issue[] | null
): Issue[] | null {
  if (typeof result !== 'object') {
    return null;
  }

  if (isArray(result)) {
    if (result.length === 0) {
      return issues;
    }

    result.forEach(inflateIssue);

    if (issues !== null) {
      issues.push(...result);
      return issues;
    }
    return result;
  }

  const issue = inflateIssue(result);

  if (issues !== null) {
    issues.push(issue);
    return issues;
  }
  return [issue];
}

/**
 * Adds issues from the validation error to the list of collected issues.
 */
export function throwOrCaptureIssues(
  error: unknown,
  options: ParserOptions | undefined,
  issues: Issue[] | null
): Issue[] {
  throwIfUnknownError(error);

  const errorIssues = error.issues;

  if (issues !== null) {
    issues.push(...errorIssues);
    return issues;
  }
  return errorIssues;
}

export function createResolveArray(
  input: unknown[],
  options: ParserOptions | undefined,
  applyConstraints: ApplyConstraints | null
): (elements: unknown[]) => any {
  return elements => {
    const inputLength = input.length;

    let issues: Issue[] | null = null;
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

    return returnValueOrRaiseIssues(output, issues);
  };
}

export function returnError(error: unknown): any {
  throwIfUnknownError(error);
  return error;
}

export function returnIssues(error: unknown): Issue[] {
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

const positiveIntegerPattern = /^[1-9]\d*$/;

export function isArrayIndex(key: any): boolean {
  return (isInteger(key) && key >= 0) || key === '0' || (typeof key === 'string' && positiveIntegerPattern.test(key));
}

export function isTupleIndex(key: any, length: number): boolean {
  return isArrayIndex(key) && parseInt(key, 10) < length;
}

export function isAsyncShapes(shapes: readonly AnyShape[]): boolean {
  let async = false;

  for (let i = 0; i < shapes.length && !async; ++i) {
    async = shapes[i].async;
  }
  return async;
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
    message = options(param, input);
  } else if (typeof options === 'string') {
    message = options; //.indexOf('%') === -1 ? options : options.replace('%s', param === undefined ? '' : String(param));
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
  return createValidationError([createIssue(input, code, param, options, message)]);
}

export function throwIfUnknownError(error: unknown): asserts error is ValidationError {
  if (!isValidationError(error)) {
    throw error;
  }
}

export function returnValueOrRaiseIssues<T>(output: T, issues: Issue[] | null): T | ValidationError {
  return issues === null ? output : createValidationError(issues);
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
