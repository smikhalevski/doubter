import { Shape } from './Shape';
import { ConstraintOptions, ParserOptions } from '../shared-types';
import { applyConstraints, raiseIssue, raiseOnError } from '../utils';

export class BigIntShape extends Shape<bigint> {
  constructor(protected options?: ConstraintOptions | string) {
    super(false);
  }

  parse(input: unknown, options?: ParserOptions): bigint {
    if (typeof input !== 'bigint') {
      raiseIssue(input, 'type', 'bigint', this.options, 'Must be a bigint');
    }

    const { constraints } = this;

    if (constraints !== null) {
      raiseOnError(applyConstraints(input, constraints, options, null));
    }
    return input;
  }
}
