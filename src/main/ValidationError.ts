import { Issue } from './types';

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
   * @param issues The array of issues that caused the error.
   * @param message The error message.
   */
  constructor(
    /**
     * The array of issues that caused the error.
     */
    public issues: Issue[],
    message?: string
  ) {
    super(message);
  }
}

ValidationError.prototype.name = 'ValidationError';
