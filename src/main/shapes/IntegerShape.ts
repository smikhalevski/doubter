import { NumberShape } from './NumberShape';
import { ParserOptions } from '../shared-types';
import { isInteger, raiseIssue, returnValueOrRaiseIssues } from '../utils';
import { CODE_TYPE, MESSAGE_INTEGER_TYPE, TYPE_INTEGER } from './constants';
import { ValidationError } from '../ValidationError';

export class IntegerShape extends NumberShape {
  safeParse(input: unknown, options?: ParserOptions): number | ValidationError {
    const { _applyConstraints } = this;

    if (!isInteger(input)) {
      return raiseIssue(input, CODE_TYPE, TYPE_INTEGER, this._options, MESSAGE_INTEGER_TYPE);
    }
    if (_applyConstraints !== null) {
      return returnValueOrRaiseIssues(input, _applyConstraints(input, options, null));
    }
    return input;
  }
}
