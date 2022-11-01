import { Shape } from './Shape';
import { InputConstraintOptionsOrMessage, ParserOptions } from '../shared-types';
import { raiseIssue } from '../utils';
import { CODE_NEVER, MESSAGE_NEVER } from '../v3/shapes/constants';
import { ValidationError } from '../ValidationError';

/**
 * The shape that always raises an issue.
 */
export class NeverShape extends Shape<never> {
  constructor(protected _options?: InputConstraintOptionsOrMessage) {
    super(false);
  }

  safeParse(input: unknown, options?: ParserOptions): ValidationError {
    return raiseIssue(input, CODE_NEVER, undefined, this._options, MESSAGE_NEVER);
  }
}
