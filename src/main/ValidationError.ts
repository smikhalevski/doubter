import { Issue } from './shared-types';

/**
 * An error thrown if parsing failed. Custom checkers and transformers can throw this error to notify that the operation
 * has failed.
 */
export class ValidationError extends Error {
  /**
   * The list of issues that caused the error.
   */
  issues: Issue[];

  /**
   * Creates a new {@linkcode ValidationError} instance.
   *
   * @param issues The mutable list of partially defined issues that have caused an error.
   */
  constructor(issues: Partial<Issue>[]) {
    let message = '';

    for (const issue of issues) {
      inflateIssue(issue);
      message +=
        '\n' + issue.code + ' at /' + issue.path!.join('/') + (issue.message != null ? ': ' + issue.message : '');
    }

    super(message);

    Object.setPrototypeOf(this, new.target.prototype);

    this.name = 'ValidationError';
    this.issues = issues as Issue[];
  }
}

export function inflateIssue(issue: Partial<Issue>): void {
  if (issue.code == null) {
    issue.code = 'unknown';
  }
  if (issue.path == null) {
    issue.path = [];
  }
}
