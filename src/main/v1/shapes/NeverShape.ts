import { Shape } from './Shape';
import { InputConstraintOptions, ParserOptions } from '../shared-types';
import { raiseIssue } from '../utils';
import { CODE_NEVER, MESSAGE_NEVER } from './constants';

/**
 * The shape that always raises an issue.
 */
export class NeverShape extends Shape<never> {
  constructor(protected options?: InputConstraintOptions | string) {
    super(false);
  }

  parse(input: unknown, options?: ParserOptions): never {
    raiseIssue(input, CODE_NEVER, undefined, this.options, MESSAGE_NEVER);
  }
}
