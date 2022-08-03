import { Type } from './Type';
import { raiseIssue } from '../utils';
import { ConstraintOptions, ParserOptions } from '../shared-types';

/**
 * The bigint type definition.
 */
export class BigIntType extends Type<bigint> {
  constructor(options?: ConstraintOptions) {
    super(false, options);
  }

  parse(input: unknown, options?: ParserOptions): bigint {
    if (typeof input !== 'bigint') {
      raiseIssue(input, 'type', 'bigint', this.options, 'Must be a bigint');
    }
    return input;
  }
}
