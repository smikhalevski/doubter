import { Issue } from './shared-types';

/**
 * The validation error that is thrown to indicate a set of issues detected in the input value.
 */
export class ValidationError extends Error {
  /**
   * The list of issues described by the error.
   */
  issues: Issue[] = [];

  /**
   * Creates a new {@link ValidationError}.
   *
   * @param issues The optional array of issues.
   */
  constructor(issues?: Partial<Issue>[]) {
    super();

    Object.setPrototypeOf(this, new.target.prototype);

    if (issues != null) {
      for (const issue of issues) {
        const { code = 'unknown', path = [], input, message, param, meta } = issue;

        this.issues.push({ code, path, input, message, param, meta });
      }
    }

    this.name = 'ValidationError';
  }
}
