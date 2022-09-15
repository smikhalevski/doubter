import { Shape } from './Shape';
import { InputConstraintOptions, ParserOptions } from '../shared-types';
import { raiseIssue } from '../utils';
import { NEVER_CODE } from './issue-codes';

export class NeverShape extends Shape<never> {
  constructor(protected options?: InputConstraintOptions | string) {
    super(false);
  }

  parse(input: unknown, options?: ParserOptions): never {
    raiseIssue(input, NEVER_CODE, undefined, this.options, 'Must not be used');
  }
}
