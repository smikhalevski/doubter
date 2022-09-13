import { Shape } from './Shape';
import { ConstraintOptions, ParserOptions } from '../shared-types';
import { applyConstraints, raiseOnError, raiseIssue } from '../utils';

export class NumberShape extends Shape<number> {
  constructor(protected options?: ConstraintOptions | string) {
    super(false);
  }

  /**
   * Constrains the number to be greater than zero.
   *
   * @param options The constraint options or an issue message.
   * @returns The copy of the shape.
   */
  positive(options?: ConstraintOptions | string): this {
    return this.gt(0, options);
  }

  /**
   * Constrains the number to be less than zero.
   *
   * @param options The constraint options or an issue message.
   * @returns The copy of the shape.
   */
  negative(options?: ConstraintOptions | string): this {
    return this.lt(0, options);
  }

  /**
   * Constrains the number to be greater than the value.
   *
   * @param value The exclusive minimum value.
   * @param options The constraint options or an issue message.
   * @returns The copy of the shape.
   */
  gt(value: number, options?: ConstraintOptions | string): this {
    return this.constrain(output => {
      if (output <= value) {
        raiseIssue(output, 'numberGreaterThan', value, options, 'Must be greater than ' + value);
      }
    }, 'gt');
  }

  /**
   * Constrains the number to be less than the value.
   *
   * @param value The exclusive maximum value.
   * @param options The constraint options or an issue message.
   * @returns The copy of the shape.
   */
  lt(value: number, options?: ConstraintOptions | string): this {
    return this.constrain(output => {
      if (output >= value) {
        raiseIssue(output, 'numberLessThan', value, options, 'Must be less than ' + value);
      }
    }, 'lt');
  }

  /**
   * Constrains the number to be greater than or equal to the value.
   *
   * @param value The inclusive minimum value.
   * @param options The constraint options or an issue message.
   * @returns The copy of the shape.
   */
  gte(value: number, options?: ConstraintOptions | string): this {
    return this.constrain(output => {
      if (output < value) {
        raiseIssue(output, 'numberGreaterThanOrEqual', value, options, 'Must be greater than or equal to ' + value);
      }
    }, 'gte');
  }

  /**
   * Constrains the number to be less than or equal to the value.
   *
   * @param value The inclusive maximum value.
   * @param options The constraint options or an issue message.
   * @returns The copy of the shape.
   */
  lte(value: number, options?: ConstraintOptions | string): this {
    return this.constrain(output => {
      if (output > value) {
        raiseIssue(output, 'numberLessThanOrEqual', value, options, 'Must be less than or equal to ' + value);
      }
    }, 'lte');
  }

  /**
   * Constrains the number to be a multiple of the divisor.
   *
   * @param divisor The number by which the input should be divisible without a remainder.
   * @param options The constraint options or an issue message.
   * @returns The copy of the shape.
   */
  multipleOf(divisor: number, options?: ConstraintOptions | string): this {
    return this.constrain(output => {
      if (output % divisor !== 0) {
        raiseIssue(output, 'numberMultipleOf', divisor, options, 'Must be a multiple of ' + divisor);
      }
    }, 'multipleOf');
  }

  parse(input: any, options?: ParserOptions): number {
    // noinspection PointlessArithmeticExpressionJS
    if (typeof input !== 'number' || input * 0 !== 0) {
      raiseIssue(input, 'type', 'number', this.options, 'Must be a number');
    }

    const { constraints } = this;

    if (constraints !== null) {
      raiseOnError(applyConstraints(input, constraints, options, null));
    }
    return input;
  }
}
