import { Shape } from './Shape';
import { InputConstraintOptions, ParserOptions } from '../shared-types';
import { raiseIssue, raiseOnError } from '../utils';
import { TYPE_CODE } from './issue-codes';

export class BigIntShape extends Shape<bigint> {
  constructor(protected options?: InputConstraintOptions | string) {
    super(false);
  }

  parse(input: unknown, options?: ParserOptions): bigint {
    if (typeof input !== 'bigint') {
      raiseIssue(input, TYPE_CODE, 'bigint', this.options, 'Must be a bigint');
    }

    const { applyConstraints } = this;
    if (applyConstraints !== null) {
      raiseOnError(applyConstraints(input, options, null));
    }
    return input;
  }
}
