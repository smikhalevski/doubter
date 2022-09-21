import { Shape } from './Shape';
import { InputConstraintOptions, OutputConstraintOptions, ParserOptions } from '../shared-types';
import { addConstraint, isFinite, raiseIfIssues, raiseIssue } from '../utils';
import {
  NUMBER_GT_CODE,
  NUMBER_GTE_CODE,
  NUMBER_LT_CODE,
  NUMBER_LTE_CODE,
  NUMBER_MULTIPLE_OF_CODE,
  TYPE_CODE,
} from './issue-codes';

export class NumberShape extends Shape<number> {
  constructor(protected options?: InputConstraintOptions | string) {
    super(false);
  }

  /**
   * Constrains the number to be greater than zero.
   *
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  positive(options?: OutputConstraintOptions | string): this {
    return this.gt(0, options);
  }

  /**
   * Constrains the number to be less than zero.
   *
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  negative(options?: OutputConstraintOptions | string): this {
    return this.lt(0, options);
  }

  /**
   * Constrains the number to be greater than the value.
   *
   * @param value The exclusive minimum value.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  gt(value: number, options?: OutputConstraintOptions | string): this {
    return addConstraint(this, NUMBER_GT_CODE, options, output => {
      if (output <= value) {
        raiseIssue(output, NUMBER_GT_CODE, value, options, 'Must be greater than ' + value);
      }
    });
  }

  /**
   * Constrains the number to be less than the value.
   *
   * @param value The exclusive maximum value.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  lt(value: number, options?: OutputConstraintOptions | string): this {
    return addConstraint(this, NUMBER_LT_CODE, options, output => {
      if (output >= value) {
        raiseIssue(output, NUMBER_LT_CODE, value, options, 'Must be less than ' + value);
      }
    });
  }

  /**
   * Constrains the number to be greater than or equal to the value.
   *
   * @param value The inclusive minimum value.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  gte(value: number, options?: OutputConstraintOptions | string): this {
    return addConstraint(this, NUMBER_GTE_CODE, options, output => {
      if (output < value) {
        raiseIssue(output, NUMBER_GTE_CODE, value, options, 'Must be greater than or equal to ' + value);
      }
    });
  }

  /**
   * Constrains the number to be less than or equal to the value.
   *
   * @param value The inclusive maximum value.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  lte(value: number, options?: OutputConstraintOptions | string): this {
    return addConstraint(this, NUMBER_LTE_CODE, options, output => {
      if (output > value) {
        raiseIssue(output, NUMBER_LTE_CODE, value, options, 'Must be less than or equal to ' + value);
      }
    });
  }

  /**
   * Constrains the number to be a multiple of the divisor.
   *
   * @param divisor The number by which the input should be divisible without a remainder.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  multipleOf(divisor: number, options?: OutputConstraintOptions | string): this {
    return addConstraint(this, NUMBER_MULTIPLE_OF_CODE, options, output => {
      if (output % divisor !== 0) {
        raiseIssue(output, NUMBER_MULTIPLE_OF_CODE, divisor, options, 'Must be a multiple of ' + divisor);
      }
    });
  }

  parse(input: unknown, options?: ParserOptions): number {
    if (!isFinite(input)) {
      raiseIssue(input, TYPE_CODE, 'number', this.options, 'Must be a number');
    }

    const { applyConstraints } = this;
    if (applyConstraints !== null) {
      raiseIfIssues(applyConstraints(input, options, null));
    }
    return input;
  }
}
