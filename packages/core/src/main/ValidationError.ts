import { Issue } from './shared-types';

export class ValidationError extends Error {
  constructor(public issues: Issue[]) {
    super();
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = 'ValidationError';
  }
}
