import { Type } from './Type';
import { raiseIssue } from '../utils';
import { ParserOptions } from '../shared-types';

/**
 * The boolean type definition.
 */
export class BooleanType extends Type<boolean> {
  parse(input: unknown, options?: ParserOptions): boolean {
    if (typeof input !== 'boolean') {
      raiseIssue(input, 'type', 'boolean', this.options, 'Must be a boolean');
    }
    return input;
  }
}
