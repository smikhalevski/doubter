import { Shape } from './Shape';
import { ConstraintOptions, ParserOptions } from '../shared-types';
import { addConstraint, applyConstraints, isFinite, raiseError, raiseIssue } from '../utils';

export class NumberShape extends Shape<number> {
  constructor(protected options?: ConstraintOptions | string) {
    super(false);
  }

  positive(options?: ConstraintOptions | string): this {
    return this.gt(0, options);
  }

  negative(options?: ConstraintOptions | string): this {
    return this.lt(0, options);
  }

  gt(value: number, options?: ConstraintOptions | string): this {
    return addConstraint(this, 'gt', input => {
      if (input <= value) {
        raiseIssue(input, 'numberGreaterThan', value, options, 'Must be greater than ' + value);
      }
    });
  }

  lt(value: number, options?: ConstraintOptions | string): this {
    return addConstraint(this, 'lt', input => {
      if (input >= value) {
        raiseIssue(input, 'numberLessThan', value, options, 'Must be less than ' + value);
      }
    });
  }

  gte(value: number, options?: ConstraintOptions | string): this {
    return addConstraint(this, 'gte', input => {
      if (input < value) {
        raiseIssue(input, 'numberGreaterThanOrEqual', value, options, 'Must be greater than or equal to ' + value);
      }
    });
  }

  lte(value: number, options?: ConstraintOptions | string): this {
    return addConstraint(this, 'lte', input => {
      if (input > value) {
        raiseIssue(input, 'numberLessThanOrEqual', value, options, 'Must be less than or equal to ' + value);
      }
    });
  }

  multipleOf(divisor: number, options?: ConstraintOptions | string): this {
    return addConstraint(this, 'multipleOf', input => {
      if (input % divisor !== 0) {
        raiseIssue(input, 'numberMultipleOf', divisor, options, 'Must be a multiple of ' + divisor);
      }
    });
  }

  parse(input: unknown, options?: ParserOptions): number {
    if (!isFinite(input)) {
      raiseIssue(input, 'type', 'number', this.options, 'Must be a number');
    }

    const { constraints } = this;

    if (constraints !== undefined) {
      raiseError(applyConstraints(input, constraints, options, null));
    }
    return input;
  }
}
