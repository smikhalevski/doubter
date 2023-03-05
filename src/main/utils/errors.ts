import { CODE_UNION } from '../constants';
import { Issue, ParseOptions } from '../types';
import { isArray, isObjectLike } from './lang';

/**
 * Stringifies the array of issues as a human-readable message.
 *
 * @param issues The array of issues to stringify.
 */
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

export function getErrorMessage(
  issues: Issue[],
  input: unknown,
  options: ParseOptions | undefined
): string | undefined {
  if (options === null || typeof options !== 'object') {
    return;
  }
  if (typeof options.errorMessage === 'function') {
    return options.errorMessage(issues, input);
  }
  if (options.errorMessage === undefined) {
    return;
  }
  return String(options.errorMessage);
}
