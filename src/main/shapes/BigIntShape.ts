import { Shape } from './Shape';
import { InputConstraintOptionsOrMessage, ParserOptions } from '../shared-types';
import { raiseIssue, returnValueOrRaiseIssues } from '../utils';
import { CODE_TYPE, MESSAGE_BIGINT_TYPE, TYPE_BIGINT } from '../v3/shapes/constants';
import { ValidationError } from '../ValidationError';

export class BigIntShape extends Shape<bigint> {
  constructor(protected _options?: InputConstraintOptionsOrMessage) {
    super(false);
  }

  safeParse(input: unknown, options?: ParserOptions): bigint | ValidationError {
    const { _applyConstraints } = this;

    if (typeof input !== 'bigint') {
      return raiseIssue(input, CODE_TYPE, TYPE_BIGINT, this._options, MESSAGE_BIGINT_TYPE);
    }
    if (_applyConstraints !== null) {
      return returnValueOrRaiseIssues(input, _applyConstraints(input, options, null));
    }
    return input;
  }
}
