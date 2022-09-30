import { Issue } from './shared-types';
import { createObject, defineProperty, extendClass, isString } from './lang-utils';

export interface ValidationError extends Error {
  /**
   * The list of issues associated with the error.
   */
  issues: Issue[];
}

/**
 * The validation error that is thrown to indicate a set of issues was detected in the input value.
 */
export class ValidationError {
  /**
   * Creates a new {@linkcode ValidationError} instance.
   *
   * @param issues The mutable array of mutable partially defined issues. Missing fields are added to issues.
   */
  constructor(issues: Partial<Issue>[]) {
    for (const issue of issues) {
      inflateIssue(issue);
    }
    this.issues = issues as Issue[];
  }
}

const prototype = extendClass(ValidationError, Error);

defineProperty(prototype, 'name', { value: 'ValidationError', writable: true, configurable: true });

defineProperty(prototype, 'message', {
  configurable: true,

  get() {
    let value = '';

    for (const { code, path, message } of this.issues) {
      value += '\n' + String(code) + ' at /' + path.map(String).join('/') + (isString(message) ? ': ' + message : '');
    }
    return value;
  },

  set(value) {
    defineProperty(this, 'message', { value, writable: true, configurable: true });
  },
});

/**
 * Adds missing fields to a partial issue.
 */
export function inflateIssue(issue: Partial<Issue>): Issue {
  issue.code ??= 'unknown';
  issue.path ??= [];
  return issue as Issue;
}

export function isValidationError(value: unknown): value is ValidationError {
  return value !== undefined && value !== null && value instanceof ValidationError;
}

/**
 * Creates a new {@linkcode ValidationError} without a heavy partial issue inflation.
 */
export function createValidationError(issues: Issue[]): ValidationError {
  const error = createObject(prototype);
  error.issues = issues;
  return error;
}
