import { ConstraintOptions, ParserOptions, Primitive } from '../shared-types';
import { Shape } from './Shape';
import { applyConstraints, raiseIssue, raiseOnError } from '../utils';

export class OneOfShape<T extends Primitive> extends Shape<T> {
  constructor(protected values: T[], protected options?: ConstraintOptions | string) {
    super(false);
  }

  parse(input: any, options?: ParserOptions): T {
    const { values } = this;

    if (!values.includes(input)) {
      raiseIssue(input, 'oneOf', values, this.options, 'Must be equal to one of: ' + values.join(', '));
    }

    const { constraints } = this;

    if (constraints !== null) {
      raiseOnError(applyConstraints(input, constraints, options, null));
    }
    return input;
  }
}
