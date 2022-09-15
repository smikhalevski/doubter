import { Shape } from './Shape';
import { InputConstraintOptions, ParserOptions } from '../shared-types';
import { applyConstraints, raiseIssue, raiseOnError } from '../utils';
import { TYPE_CODE } from './issue-codes';

export class BooleanShape extends Shape<boolean> {
  constructor(protected options?: InputConstraintOptions | string) {
    super(false);
  }

  parse(input: unknown, options?: ParserOptions): boolean {
    if (typeof input !== 'boolean') {
      raiseIssue(input, TYPE_CODE, 'boolean', this.options, 'Must be a boolean');
    }

    const { constraints } = this;
    if (constraints !== null) {
      raiseOnError(applyConstraints(input, constraints, options, null));
    }
    return input;
  }
}
