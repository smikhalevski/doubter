import { Shape } from './Shape';
import { ConstraintOptions, ParserOptions } from '../shared-types';
import { raiseIssue } from '../utils';

export class NeverShape extends Shape<never> {
  constructor(protected options?: ConstraintOptions | string) {
    super(false);
  }

  parse(input: unknown, options?: ParserOptions): never {
    raiseIssue(input, 'never', undefined, this.options, 'Must not be used');
  }
}
