import { NumberType } from './NumberType';
import { raiseIssue } from '../utils';
import { ParserOptions } from '../shared-types';

const isInteger = Number.isInteger;

/**
 * The integer type definition.
 */
export class IntegerType extends NumberType {
  parse(input: unknown, options?: ParserOptions): number {
    if (!isInteger(input)) {
      raiseIssue(input, 'type', 'integer', this.options, 'Must be an integer');
    }

    return super.parse(input, options);
  }
}
