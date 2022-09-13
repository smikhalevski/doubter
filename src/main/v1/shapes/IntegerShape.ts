import { NumberShape } from './NumberShape';
import { ParserOptions } from '../shared-types';
import { applyConstraints, isInteger, raiseIssue, raiseOnError } from '../utils';

export class IntegerShape extends NumberShape {
  parse(input: unknown, options?: ParserOptions): number {
    if (!isInteger(input)) {
      raiseIssue(input, 'type', 'integer', this.options, 'Must be an integer');
    }

    const { constraints } = this;

    if (constraints !== null) {
      raiseOnError(applyConstraints(input, constraints, options, null));
    }
    return input;
  }
}
