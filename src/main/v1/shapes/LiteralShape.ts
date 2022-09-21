import { Shape } from './Shape';
import { InputConstraintOptions, ParserOptions, Primitive } from '../shared-types';
import { isEqual, raiseIfIssues, raiseIssue } from '../utils';
import { CODE_LITERAL } from './constants';

export class LiteralShape<T extends Primitive> extends Shape<T> {
  constructor(protected value: T, protected options?: InputConstraintOptions | string) {
    super(false);
  }

  parse(input: unknown, options?: ParserOptions): T {
    const { value } = this;

    if (!isEqual(input, value)) {
      raiseIssue(input, CODE_LITERAL, value, this.options, 'Must be exactly equal to ' + value);
    }

    const { applyConstraints } = this;
    if (applyConstraints !== null) {
      raiseIfIssues(applyConstraints(input, options, null));
    }
    return input;
  }
}
