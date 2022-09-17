import { InputConstraintOptions, ParserOptions, Primitive } from '../shared-types';
import { Shape } from './Shape';
import { raiseIfIssues, raiseIssue } from '../utils';
import { ONE_OF_CODE } from './issue-codes';

export class OneOfShape<T extends Primitive> extends Shape<T> {
  constructor(protected values: T[], protected options?: InputConstraintOptions | string) {
    super(false);
  }

  parse(input: any, options?: ParserOptions): T {
    const { values } = this;

    if (!values.includes(input)) {
      raiseIssue(input, ONE_OF_CODE, values, this.options, 'Must be equal to one of: ' + values.join(', '));
    }

    const { applyConstraints } = this;
    if (applyConstraints !== null) {
      raiseIfIssues(applyConstraints(input, options, null));
    }
    return input;
  }
}
