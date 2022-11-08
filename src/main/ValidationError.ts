import { Issue } from './shared-types';

export class ValidationError extends Error {
  issues: Issue[];

  constructor(issues: Partial<Issue>[]) {
    super();

    this.name = 'ValidationError';
    this.issues = inflateIssues(issues);
  }
}

Object.defineProperty(ValidationError.prototype, 'message', {
  get() {
    let value = '';

    for (const issue of this.issues) {
      value += '\n' + issue.code + ' at /' + issue.path.join('/') + (issue.message != null ? ': ' + issue.message : '');
    }
    return value;
  },

  set(value) {
    Object.defineProperty(this, 'message', { value, writable: true, configurable: true });
  },
});

export function inflateIssues(issues: Partial<Issue>[]): Issue[] {
  const issuesLength = issues.length;

  for (let i = 0; i < issuesLength; ++i) {
    inflateIssue(issues[i]);
  }
  return issues as Issue[];
}

export function inflateIssue(issue: Partial<Issue>): Issue {
  if (issue.code == null) {
    issue.code = 'unknown';
  }
  if (issue.path == null) {
    issue.path = [];
  }
  return issue as Issue;
}
