import { Shape } from './Shape';
import { InputConstraintOptions, ParserOptions, Primitive } from '../shared-types';
import { isEqual, raiseIfIssues, raiseIssue } from '../utils';
import { LITERAL_CODE } from './issue-codes';

export class LiteralShape<T extends Primitive> extends Shape<T> {
  constructor(protected value: T, protected options?: InputConstraintOptions | string) {
    super(false);
  }

  parse(input: unknown, options?: ParserOptions): T {
    const { value } = this;

    if (!isEqual(input, value)) {
      raiseIssue(input, LITERAL_CODE, value, this.options, 'Must be exactly equal to ' + value);
    }

    const { constraintsProcessor } = this;
    if (constraintsProcessor !== null) {
      raiseIfIssues(constraintsProcessor(input, options, null));
    }
    return input;
  }
}
