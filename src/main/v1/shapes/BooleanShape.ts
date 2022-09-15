import { Shape } from './Shape';
import { InputConstraintOptions, ParserOptions } from '../shared-types';
import { raiseIssue, raiseOnError } from '../utils';
import { TYPE_CODE } from './issue-codes';

export class BooleanShape extends Shape<boolean> {
  constructor(protected options?: InputConstraintOptions | string) {
    super(false);
  }

  parse(input: unknown, options?: ParserOptions): boolean {
    if (typeof input !== 'boolean') {
      raiseIssue(input, TYPE_CODE, 'boolean', this.options, 'Must be a boolean');
    }

    const { applyConstraints } = this;
    if (applyConstraints !== null) {
      raiseOnError(applyConstraints(input, options, null));
    }
    return input;
  }
}
