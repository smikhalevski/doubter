import { Shape } from './Shape';
import { ConstraintOptions, ParserOptions } from '../shared-types';
import { raiseIssue } from '../utils';

export class BigIntShape extends Shape<bigint> {
  constructor(protected options?: ConstraintOptions | string) {
    super(false);
  }

  parse(input: unknown, options?: ParserOptions): bigint {
    if (typeof input !== 'bigint') {
      raiseIssue(input, 'type', 'bigint', this.options, 'Must be a bigint');
    }
    return input;
  }
}
