import { Shape } from './Shape';
import { InputConstraintOptionsOrMessage, ParserOptions } from '../shared-types';
import { returnOrRaiseIssues, raiseIssue } from '../utils';
import { CODE_TYPE, MESSAGE_BOOLEAN_TYPE, TYPE_BOOLEAN } from './constants';

export class BooleanShape extends Shape<boolean> {
  constructor(protected options?: InputConstraintOptionsOrMessage) {
    super(false);
  }

  parse(input: unknown, options?: ParserOptions): boolean {
    const { applyConstraints } = this;

    if (typeof input !== 'boolean') {
      return raiseIssue(input, CODE_TYPE, TYPE_BOOLEAN, this.options, MESSAGE_BOOLEAN_TYPE);
    }
    if (applyConstraints !== null) {
      return returnOrRaiseIssues(input, applyConstraints(input, options, null));
    }
    return input;
  }
}
