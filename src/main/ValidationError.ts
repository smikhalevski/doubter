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
    if (message === undefined) {
      try {
        message = JSON.stringify(issues, replacer, 2);
      } catch {}
    }

    super(message);
  }
}

ValidationError.prototype.name = 'ValidationError';

function replacer(_k: any, v: any): any {
  return typeof v === 'symbol' || typeof v === 'bigint' || v instanceof Symbol || v instanceof BigInt ? String(v) : v;
}
