import { Type } from './Type';
import { raiseIssue } from '../utils';
import { ConstraintOptions, ParserOptions } from '../shared-types';

/**
 * The type definition that always raises an issue.
 */
export class NeverType extends Type<never> {
  constructor(options?: ConstraintOptions) {
    super(false, options);
  }

  parse(input: unknown, options?: ParserOptions): never {
    raiseIssue(input, 'never', undefined, this.options, 'Must not be used');
  }
}
