import { NumberShape } from './NumberShape';
import { ParserOptions } from '../shared-types';
import { isInteger, raiseIssue, raiseOnIssues } from '../utils';
import { TYPE_CODE } from './issue-codes';

export class IntegerShape extends NumberShape {
  parse(input: unknown, options?: ParserOptions): number {
    if (!isInteger(input)) {
      raiseIssue(input, TYPE_CODE, 'integer', this.options, 'Must be an integer');
    }

    const { applyConstraints } = this;
    if (applyConstraints !== null) {
      raiseOnIssues(applyConstraints(input, options, null));
    }
    return input;
  }
}
