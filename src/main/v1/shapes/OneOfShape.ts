import { InputConstraintOptions, ParserOptions, Primitive } from '../shared-types';
import { Shape } from './Shape';
import { raiseIfIssues, raiseIssue } from '../utils';
import { CODE_ENUM } from './constants';

export class OneOfShape<T extends Primitive> extends Shape<T> {
  constructor(protected values: T[], protected options?: InputConstraintOptions | string) {
    super(false);
  }

  parse(input: any, options?: ParserOptions): T {
    const { values } = this;

    if (!values.includes(input)) {
      raiseIssue(input, CODE_ENUM, values, this.options, 'Must be equal to one of: ' + values.join(', '));
    }

    const { applyConstraints } = this;
    if (applyConstraints !== null) {
      raiseIfIssues(applyConstraints(input, options, null));
    }
    return input;
  }
}
