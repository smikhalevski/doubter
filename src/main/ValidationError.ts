import { Issue } from './types';
import { stringifyIssues } from './utils/stringifyIssues';

/**
 * An error thrown if parsing failed. Custom check callbacks, refinement predicates, transformers, and fallback
 * functions can throw this error to notify that the operation has failed.
 */
export class ValidationError extends Error {
  /**
   * The global function that stringifies issues as an error message, if a message is omitted when
   * {@linkcode ValidationError} is instantiated.
   */
  static issuesStringifier = stringifyIssues;

  /**
   * Creates a new {@linkcode ValidationError} instance.
   *
   * @param issues The array of issues that caused the validation error.
   * @param message The error message. If omitted then `issues` are converted to a string using
   * {@linkcode ValidationError.issuesStringifier} and used as a message.
   */
  constructor(
    /**
     * The array of issues that caused the error.
     */
    public issues: Issue[],
    message = ValidationError.issuesStringifier(issues)
  ) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);

    this.name = 'ValidationError';
  }
}
