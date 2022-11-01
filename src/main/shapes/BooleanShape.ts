import { Shape } from './Shape';
import { InputConstraintOptionsOrMessage, ParserOptions } from '../shared-types';
import { raiseIssue, returnValueOrRaiseIssues } from '../utils';
import { CODE_TYPE, MESSAGE_BOOLEAN_TYPE, TYPE_BOOLEAN } from '../v3/shapes/constants';
import { ValidationError } from '../ValidationError';

export class BooleanShape extends Shape<boolean> {
  constructor(protected _options?: InputConstraintOptionsOrMessage) {
    super(false);
  }

  safeParse(input: unknown, options?: ParserOptions): boolean | ValidationError {
    const { _applyConstraints } = this;

    if (typeof input !== 'boolean') {
      return raiseIssue(input, CODE_TYPE, TYPE_BOOLEAN, this._options, MESSAGE_BOOLEAN_TYPE);
    }
    if (_applyConstraints !== null) {
      return returnValueOrRaiseIssues(input, _applyConstraints(input, options, null));
    }
    return input;
  }
}
