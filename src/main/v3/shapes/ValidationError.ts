import { Issue } from '../shared-types';

export class ValidationError extends Error {
  issues: Issue[];

  constructor(issues: Partial<Issue>[]) {
    let message = '';

    for (let i = 0; i < issues.length; ++i) {
      const issue = inflateIssue(issues[i]);
      issues[i] = issue;
      message +=
        '\n' + issue.code + ' at /' + issue.path.join('/') + (issue.message != null ? ': ' + issue.message : '');
    }

    super(message);

    this.name = 'ValidationError';
    this.issues = issues.map(inflateIssue);
  }
}

export function inflateIssue(issue: Partial<Issue>): Issue {
  issue.code ??= 'unknown';
  issue.path ??= [];
  return issue as Issue;
}
