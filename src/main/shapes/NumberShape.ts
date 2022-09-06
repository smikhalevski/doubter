import { Shape } from './Shape';
import { ConstraintOptions } from '../shared-types';
import { addConstraint, applyConstraints, dieError, raiseError } from './utils';
import { ParserOptions } from './shared-types';

const isFinite = Number.isFinite as (value: unknown) => value is number;

export class NumberShape extends Shape<number> {
  constructor(protected options?: ConstraintOptions | string) {
    super(false);
  }

  positive(options?: ConstraintOptions): this {
    return this.gt(0, options);
  }

  negative(options?: ConstraintOptions): this {
    return this.lt(0, options);
  }

  gt(value: number, options?: ConstraintOptions): this {
    return addConstraint(this, 'gt', input => {
      if (input <= value) {
        raiseError(input, 'numberGreaterThan', value, options, 'Must be greater than ' + value);
      }
    });
  }

  lt(value: number, options?: ConstraintOptions): this {
    return addConstraint(this, 'lt', input => {
      if (input >= value) {
        raiseError(input, 'numberLessThan', value, options, 'Must be less than ' + value);
      }
    });
  }

  gte(value: number, options?: ConstraintOptions): this {
    return addConstraint(this, 'gte', input => {
      if (input < value) {
        raiseError(input, 'numberGreaterThanOrEqual', value, options, 'Must be greater than or equal to ' + value);
      }
    });
  }

  lte(value: number, options?: ConstraintOptions): this {
    return addConstraint(this, 'lte', input => {
      if (input > value) {
        raiseError(input, 'numberLessThanOrEqual', value, options, 'Must be less than or equal to ' + value);
      }
    });
  }

  multipleOf(divisor: number, options?: ConstraintOptions): this {
    return addConstraint(this, 'multipleOf', input => {
      if (input % divisor !== 0) {
        raiseError(input, 'numberMultipleOf', divisor, options, 'Must be a multiple of ' + divisor);
      }
    });
  }

  parse(input: unknown, options?: ParserOptions): number {
    if (!isFinite(input)) {
      raiseError(input, 'type', 'number', this.options, 'Must be a number');
    }

    const { constraints } = this;

    if (constraints !== undefined) {
      dieError(applyConstraints(input, constraints, options, null));
    }
    return input;
  }
}
