import { Shape } from './Shape';
import { InputConstraintOptions, ParserOptions } from '../shared-types';
import { applyConstraints, raiseIssue, raiseOnError } from '../utils';
import { TYPE_CODE } from './issue-codes';

export class BigIntShape extends Shape<bigint> {
  constructor(protected options?: InputConstraintOptions | string) {
    super(false);
  }

  parse(input: unknown, options?: ParserOptions): bigint {
    if (typeof input !== 'bigint') {
      raiseIssue(input, TYPE_CODE, 'bigint', this.options, 'Must be a bigint');
    }

    const { constraints } = this;
    if (constraints !== null) {
      raiseOnError(applyConstraints(input, constraints, options, null));
    }
    return input;
  }
}
