import { Shape } from './Shape';
import { InputConstraintOptionsOrMessage, ParserOptions } from '../shared-types';
import { raiseIssue, returnOrRaiseIssues } from '../utils';
import { CODE_TYPE, MESSAGE_BIGINT_TYPE, TYPE_BIGINT } from './constants';
import { ValidationError } from '../ValidationError';

export class BigIntShape extends Shape<bigint> {
  constructor(protected options?: InputConstraintOptionsOrMessage) {
    super(false);
  }

  safeParse(input: unknown, options?: ParserOptions): bigint | ValidationError {
    const { _applyConstraints } = this;

    if (typeof input !== 'bigint') {
      return raiseIssue(input, CODE_TYPE, TYPE_BIGINT, this.options, MESSAGE_BIGINT_TYPE);
    }
    if (_applyConstraints !== null) {
      return returnOrRaiseIssues(input, _applyConstraints(input, options, null));
    }
    return input;
  }
}
