import { Issue } from './issue-utils';

export class ValidationError extends Error {
  constructor(public issues: Issue[]) {
    super();
    this.name = 'ValidationError';
  }
}
