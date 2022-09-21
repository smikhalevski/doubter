import { Shape } from './Shape';
import { InputConstraintOptions, ParserOptions } from '../shared-types';
import { raiseIssue } from '../utils';
import { CODE_NEVER } from './constants';

export class NeverShape extends Shape<never> {
  constructor(protected options?: InputConstraintOptions | string) {
    super(false);
  }

  parse(input: unknown, options?: ParserOptions): never {
    raiseIssue(input, CODE_NEVER, undefined, this.options, 'Must not be used');
  }
}
