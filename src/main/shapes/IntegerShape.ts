import { NumberShape } from './NumberShape';
import { ParserOptions } from '../shared-types';
import { isInteger, returnOrRaiseIssues, raiseIssue } from '../utils';
import { CODE_TYPE, MESSAGE_INTEGER_TYPE, TYPE_INTEGER } from './constants';

export class IntegerShape extends NumberShape {
  parse(input: unknown, options?: ParserOptions): number {
    const { applyConstraints } = this;

    if (!isInteger(input)) {
      return raiseIssue(input, CODE_TYPE, TYPE_INTEGER, this.options, MESSAGE_INTEGER_TYPE);
    }
    if (applyConstraints !== null) {
      return returnOrRaiseIssues(input, applyConstraints(input, options, null));
    }
    return input;
  }
}
