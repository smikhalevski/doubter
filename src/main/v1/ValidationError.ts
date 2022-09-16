import { Issue } from './shared-types';
import { isString } from './utils';

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

    for (const issue of issues) {
      issue.code ??= 'unknown';
      issue.path ??= [];
    }

    this.name = 'ValidationError';
    this.issues = issues as Issue[];
  }

  get message() {
    let errorMessage = '';
    for (const { code, path, message } of this.issues) {
      errorMessage += '\n' + code + ' at /' + path.join('/') + (isString(message) ? ': ' + message : '');
    }
    return errorMessage;
  }

  set message(message: string) {
    Object.defineProperty(this, 'message', {
      value: message,
      writable: true,
      configurable: true,
    });
  }
}
