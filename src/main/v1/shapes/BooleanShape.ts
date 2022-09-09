import { Shape } from './Shape';
import { ConstraintOptions, ParserOptions } from '../shared-types';
import { raiseIssue } from '../utils';

export class BooleanShape extends Shape<boolean> {
  constructor(protected options?: ConstraintOptions | string) {
    super(false);
  }

  parse(input: unknown, options?: ParserOptions): boolean {
    if (typeof input !== 'boolean') {
      raiseIssue(input, 'type', 'boolean', this.options, 'Must be a boolean');
    }
    return input;
  }
}
