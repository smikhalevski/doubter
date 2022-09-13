import { Shape } from './Shape';
import { ConstraintOptions, ParserOptions, Primitive } from '../shared-types';
import { applyConstraints, isEqual, raiseIssue, raiseOnError } from '../utils';

export class LiteralShape<T extends Primitive> extends Shape<T> {
  constructor(protected value: T, protected options?: ConstraintOptions | string) {
    super(false);
  }

  parse(input: unknown, options?: ParserOptions): T {
    const { value } = this;

    if (!isEqual(input, value)) {
      raiseIssue(input, 'literal', value, this.options, 'Must be exactly equal to ' + value);
    }

    const { constraints } = this;

    if (constraints !== null) {
      raiseOnError(applyConstraints(input, constraints, options, null));
    }
    return input;
  }
}
