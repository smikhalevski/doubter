import { Issue } from './shared-types';
import { CODE_UNION, CODE_UNKNOWN } from './constants';
import { isArray, isObjectLike } from './utils';

/**
 * An error thrown if parsing failed. Custom checkers and transformers can throw this error to notify that the operation
 * has failed.
 */
export class ValidationError extends Error {
  /**
   * The array of issues that caused the error.
   */
  issues: Issue[];

  constructor(message?: string, issues?: Partial<Issue>[]);

  constructor(issues: Partial<Issue>[]);

  constructor(message?: any, issues?: any) {
    issues.forEach(inflateIssue);

    super(message ?? stringifyIssues(issues));

    Object.setPrototypeOf(this, new.target.prototype);

    this.name = 'ValidationError';
    this.issues = issues;
  }
}

export function inflateIssue(issue: Partial<Issue>): void {
  issue.code ??= CODE_UNKNOWN;
  issue.path ??= [];
}

function stringifyIssues(issues: Issue[]): string {
  const message = stringifyIssues_(issues);
  return message.indexOf('\n') !== -1 ? '\n' + message : message;
}

function stringifyIssues_(issues: Issue[]): string {
  let resultStr = '';

  for (let paragraph = false, i = 0; i < issues.length; ++i) {
    const issue = issues[i];

    let str =
      issue.code + ' at /' + issue.path.join('/') + (typeof issue.message === 'string' ? ': ' + issue.message : '');

    if (issue.code === CODE_UNION && isObjectLike(issue.param)) {
      const { inputTypes, issueGroups } = issue.param;

      if (isArray(issueGroups)) {
        for (let j = 0; j < issueGroups.length; ++j) {
          str += indent('\n\n' + (j + 1 + ')').padEnd(4) + indent(stringifyIssues(issueGroups[j]), '    '), '  ');
        }
      } else if (isArray(inputTypes)) {
        str += ' (' + inputTypes.join(', ') + ')';
      }
    }

    const issueParagraph = str.indexOf('\n') !== -1;

    if (i !== 0) {
      resultStr += paragraph || issueParagraph ? '\n\n' : '\n';
    }

    paragraph = issueParagraph;
    resultStr += str;
  }

  return resultStr;
}

function indent(str: string, padding: string): string {
  return str.replace(/\n+/g, '$&' + padding);
}
