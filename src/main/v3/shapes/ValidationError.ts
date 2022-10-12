import { __extends } from 'tslib';
import { Issue } from '../shared-types';
import { objectCreate, defineProperty } from '../lang-utils';

export interface ValidationError extends Error {}

export class ValidationError {
  issues: Issue[];

  constructor(issues: Partial<Issue>[]) {
    this.issues = issues.map(inflateIssue);
  }
}

// Avoid the super constructor call to prevent the redundant stack trace population.
__extends(ValidationError, Error);

const prototype = ValidationError.prototype;

defineProperty(prototype, 'name', { value: 'ValidationError', writable: true, configurable: true });

defineProperty(prototype, 'message', {
  configurable: true,

  get() {
    let value = '';

    for (const issue of this.issues) {
      value += '\n' + issue.code + ' at /' + issue.path.join('/') + (issue.message != null ? ': ' + issue.message : '');
    }
    return value;
  },

  set(value) {
    defineProperty(this, 'message', { value, writable: true, configurable: true });
  },
});

export function createValidationError(issues: Issue[]): ValidationError {
  const error = objectCreate(prototype);
  error.issues = issues;
  return error;
}

export function inflateIssue(issue: Partial<Issue>): Issue {
  issue.code ??= 'unknown';
  issue.path ??= [];
  return issue as Issue;
}
