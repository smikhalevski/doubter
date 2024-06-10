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
    super(message !== undefined ? message : stringify(issues));
  }
}

ValidationError.prototype.name = 'ValidationError';

export function stringify(value: any): string {
  const ancestors: any[] = [];

  let depth = 0;

  return JSON.stringify(
    value,
    function (_key, value) {
      if (typeof value === 'symbol' || value instanceof Symbol || value instanceof RegExp) {
        return String(value);
      }

      if (typeof value === 'bigint' || (typeof BigInt !== 'undefined' && value instanceof BigInt)) {
        return value + 'n';
      }

      if (typeof value === 'function' || value instanceof Function) {
        return 'ƒ ' + (value.name || '') + '()';
      }

      if (
        value === null ||
        typeof value !== 'object' ||
        value instanceof Boolean ||
        value instanceof Date ||
        value instanceof Number ||
        value instanceof String
      ) {
        return value;
      }

      while (depth !== 0 && ancestors[depth - 1] !== this) {
        depth--;
      }

      for (let i = 0; i < depth; i++) {
        if (ancestors[i] === value) {
          return '[Circular]';
        }
      }

      ancestors[depth++] = value;
      return value;
    },
    2
  );
}
