import { Shape } from './Shape';
import { InputConstraintOptionsOrMessage, ParserOptions } from '../shared-types';
import { raiseIfIssues, raiseIssue } from '../utils';
import { CODE_TYPE, MESSAGE_BIGINT_TYPE, TYPE_BIGINT } from './constants';

export class BigIntShape extends Shape<bigint> {
  constructor(protected options?: InputConstraintOptionsOrMessage) {
    super(false);
  }

  parse(input: unknown, options?: ParserOptions): bigint {
    if (typeof input !== 'bigint') {
      raiseIssue(input, CODE_TYPE, TYPE_BIGINT, this.options, MESSAGE_BIGINT_TYPE);
    }

    const { applyConstraints } = this;
    if (applyConstraints !== null) {
      raiseIfIssues(applyConstraints(input, options, null));
    }
    return input;
  }
}
