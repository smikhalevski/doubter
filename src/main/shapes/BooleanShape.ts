import { Shape } from './Shape';
import { InputConstraintOptionsOrMessage, ParserOptions } from '../shared-types';
import { raiseIssue, returnOrRaiseIssues } from '../utils';
import { CODE_TYPE, MESSAGE_BOOLEAN_TYPE, TYPE_BOOLEAN } from './constants';
import { ValidationError } from '../ValidationError';

export class BooleanShape extends Shape<boolean> {
  constructor(protected options?: InputConstraintOptionsOrMessage) {
    super(false);
  }

  safeParse(input: unknown, options?: ParserOptions): boolean | ValidationError {
    const { _applyConstraints } = this;

    if (typeof input !== 'boolean') {
      return raiseIssue(input, CODE_TYPE, TYPE_BOOLEAN, this.options, MESSAGE_BOOLEAN_TYPE);
    }
    if (_applyConstraints !== null) {
      return returnOrRaiseIssues(input, _applyConstraints(input, options, null));
    }
    return input;
  }
}
