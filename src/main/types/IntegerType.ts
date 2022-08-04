import { NumberType } from './NumberType';
import { isInteger, raiseIssue } from '../utils';
import { ConstraintOptions, ParserOptions } from '../shared-types';

/**
 * The integer type definition.
 */
export class IntegerType extends NumberType {
  constructor(options?: ConstraintOptions) {
    super(options);
  }

  parse(input: unknown, options?: ParserOptions): number {
    if (!isInteger(input)) {
      raiseIssue(input, 'type', 'integer', this.options, 'Must be an integer');
    }

    return super.parse(input, options);
  }
}
