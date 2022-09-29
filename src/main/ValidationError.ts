import { INVALID, Issue } from './shared-types';
import { restoreIssue } from './utils';

/**
 * The validation error that is thrown to indicate a set of issues detected in the input value.
 */
export class ValidationError extends Error {
  /**
   * The list of issues associated with the error.
   */
  issues: Issue[];

  /**
   * Creates a new {@linkcode ValidationError}.
   *
   * @param issues The mutable array of mutable partially defined issues.
   */
  constructor(issues: Partial<Issue>[]) {
    super();

    Object.setPrototypeOf(this, new.target.prototype);

    Error.captureStackTrace?.(this, ValidationError);

    issues.forEach(restoreIssue);

    this.issues = issues as Issue[];
  }

  get message() {
    let errorMessage = '';
    for (const { code, path, message } of this.issues) {
      errorMessage += '\n' + code + ' at /' + path.join('/') + (typeof message === 'string' ? ': ' + message : '');
    }
    return errorMessage;
  }

  set message(value: string) {
    Object.defineProperty(this, 'message', { value, writable: true, configurable: true });
  }
}

Object.defineProperty(ValidationError.prototype, 'name', { value: 'ValidationError', writable: true });

Object.defineProperty(ValidationError.prototype, INVALID, { value: true });
