import { Issue } from './typings';

/**
 * An error thrown if parsing failed. Custom check callbacks, refinement predicates, converters, and fallback
 * functions can throw this error to notify that the operation has failed.
 *
 * @group Other
 */
export class ValidationError extends Error {
  /**
   * Creates a new {@link ValidationError} instance.
   *
   * @param issues The array of issues that caused the validation error.
   * @param message The error message. If omitted then `issues` are converted to a string using
   * {@link ValidationError.formatIssues} and used as a message.
   */
  constructor(
    /**
     * The array of issues that caused the error.
     */
    public issues: Issue[],
    message = ValidationError.formatIssues(issues)
  ) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);

    this.name = 'ValidationError';
  }

  /**
   * The global function that stringifies issues as an error message, if a message is omitted when
   * {@link ValidationError} is instantiated.
   */
  static formatIssues = (issues: Issue[]): string => JSON.stringify(issues, stringifyES6Values, 2);
}

function stringifyES6Values(key: any, value: any): any {
  return typeof value === 'symbol' || typeof value === 'bigint' ? String(value) : value;
}
