import { Issue } from './shared-types';

export class ValidationError extends Error {
  issues: Issue[];

  constructor(issues: Partial<Issue>[]) {
    super();

    for (const issue of issues) {
      issue.code ??= 'unknown';
      issue.path ??= [];
    }

    this.name = 'ValidationError';
    this.issues = issues as Issue[];
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
