import { Shape } from './Shape';
import { InputConstraintOptionsOrMessage, ParserOptions } from '../shared-types';
import { returnOrRaiseIssues, raiseIssue } from '../utils';
import { CODE_TYPE, MESSAGE_BIGINT_TYPE, TYPE_BIGINT } from './constants';

export class BigIntShape extends Shape<bigint> {
  constructor(protected options?: InputConstraintOptionsOrMessage) {
    super(false);
  }

  parse(input: unknown, options?: ParserOptions): bigint {
    const { applyConstraints } = this;

    if (typeof input !== 'bigint') {
      return raiseIssue(input, CODE_TYPE, TYPE_BIGINT, this.options, MESSAGE_BIGINT_TYPE);
    }
    if (applyConstraints !== null) {
      return returnOrRaiseIssues(input, applyConstraints(input, options, null));
    }
    return input;
  }
}
