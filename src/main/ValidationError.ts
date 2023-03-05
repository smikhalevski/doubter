import { Issue } from './shared-types';
import { CODE_UNION } from './constants';
import { isArray, isObjectLike } from './utils/lang';

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

export function stringifyIssues(issues: Issue[]): string {
  let str = '';

  for (let paragraph = false, i = 0; i < issues.length; ++i) {
    const issue = issues[i];

    let issueStr = stringifyPath(issue.path);

    if (typeof issue.message === 'string' && issue.message !== '') {
      issueStr += ': ' + issue.message;
    } else if (typeof issue.code === 'string' && issue.code !== '') {
      issueStr += ': ' + issue.code;
    }

    if (issue.code === CODE_UNION && isObjectLike(issue.param)) {
      const { inputTypes, issueGroups } = issue.param;

      if (isArray(issueGroups)) {
        for (let j = 0; j < issueGroups.length; ++j) {
          issueStr += indent('\n\n' + (j + 1 + ')').padEnd(4) + indent(stringifyIssues(issueGroups[j]), '    '), '  ');
        }
      } else if (isArray(inputTypes)) {
        issueStr += ' (' + inputTypes.join(', ') + ')';
      }
    }

    const issueParagraph = issueStr.indexOf('\n') !== -1;

    if (i !== 0) {
      str += paragraph || issueParagraph ? '\n\n' : '\n';
    }

    paragraph = issueParagraph;
    str += issueStr;
  }

  return str;
}

function stringifyPath(path: any[] | undefined): string {
  if (!isArray(path) || path.length === 0) {
    return '/';
  }
  let str = '';
  for (const key of path) {
    str += '/' + (typeof key === 'object' || typeof key === 'function' ? '{⋯}' : String(key));
  }
  return str;
}

function indent(str: string, padding: string): string {
  return str.replace(/\n+/g, '$&' + padding);
}
