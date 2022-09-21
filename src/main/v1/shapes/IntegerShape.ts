import { NumberShape } from './NumberShape';
import { ParserOptions } from '../shared-types';
import { isInteger, raiseIfIssues, raiseIssue } from '../utils';
import { CODE_TYPE, MESSAGE_INTEGER_TYPE, TYPE_INTEGER } from './constants';

export class IntegerShape extends NumberShape {
  parse(input: unknown, options?: ParserOptions): number {
    if (!isInteger(input)) {
      raiseIssue(input, CODE_TYPE, TYPE_INTEGER, this.options, MESSAGE_INTEGER_TYPE);
    }

    const { applyConstraints } = this;
    if (applyConstraints !== null) {
      raiseIfIssues(applyConstraints(input, options, null));
    }
    return input;
  }
}
