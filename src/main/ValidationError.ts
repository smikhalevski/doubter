import { Issue } from './types';

/**
 * An error thrown if parsing failed. Custom check callbacks, refinement predicates, converters, and fallback
 * functions can throw this error to notify that the operation has failed.
 *
 * @group Other
 */
export class ValidationError extends Error {
  /**
   * The global function that stringifies issues as an error message, if a message is omitted when
   * {@link ValidationError} is instantiated.
   */
  static formatIssues = (issues: Issue[]): string => JSON.stringify(issues, replacer, 2);

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
    this.name = 'ValidationError';
  }
}

function replacer(key: any, v: any): any {
  return typeof v === 'symbol' || typeof v === 'bigint' || v instanceof Symbol || v instanceof BigInt ? String(v) : v;
}
