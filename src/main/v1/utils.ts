import {
  ApplyConstraints,
  Constraint,
  Dict,
  InputConstraintOptions,
  Issue,
  OutputConstraintOptions,
  ParserOptions,
} from './shared-types';
import { ValidationError } from './ValidationError';
import type { AnyShape, Shape } from './shapes/Shape';

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

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
  id: string | undefined | null,
  options: OutputConstraintOptions | string | undefined,
  constraint: Constraint<S['output']>
): S {
  return shape.constrain(constraint, { id, unsafe: isObjectLike(options) ? options.unsafe : false });
}

export function captureIssues(error: unknown): Issue[] {
  raiseOnUnknownError(error);
  return error.issues;
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
  issues: Issue[] | null,
  outputProcessor: (values: T[], issues: Issue[] | null) => R
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

      if (issues !== null) {
        issues.push(...error.issues);
      } else {
        issues = error.issues;
      }
    }

    return outputProcessor(values, issues);
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

/**
 * Creates an optimized function that applies constraints to the input.
 */
export function createApplyConstraints<T>(constraints: any[]): ApplyConstraints<T> | null {
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
  } else if (isString(options)) {
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

export function raiseOnUnknownError(error: unknown): asserts error is ValidationError {
  if (!(error instanceof ValidationError)) {
    throw error;
  }
}

export function raiseOnIssues(issues: Issue[] | null): void {
  if (issues !== null) {
    throw new ValidationError(issues);
  }
}

export function raiseOrCaptureIssues(
  error: unknown,
  options: ParserOptions | undefined,
  issues: Issue[] | null
): Issue[] {
  raiseOnUnknownError(error);

  if (issues !== null) {
    issues.push(...error.issues);
    return issues;
  }
  if (isObjectLike(options) && options.fast) {
    throw error;
  }
  return error.issues;
}

export function raiseOrCaptureIssuesForKey(
  error: unknown,
  options: ParserOptions | undefined,
  issues: Issue[] | null,
  key: unknown
): Issue[] {
  raiseOnUnknownError(error);

  for (const issue of error.issues) {
    issue.path.unshift(key);
  }
  if (issues !== null) {
    issues.push(...error.issues);
    return issues;
  }
  if (isObjectLike(options) && options.fast) {
    throw error;
  }
  return error.issues;
}
