import { Shape } from './Shape';
import { InputConstraintOptionsOrMessage, OutputConstraintOptionsOrMessage, ParserOptions } from '../shared-types';
import { addConstraint, isFinite, raiseIssue, returnOrRaiseIssues } from '../utils';
import {
  CODE_NUMBER_GT,
  CODE_NUMBER_GTE,
  CODE_NUMBER_LT,
  CODE_NUMBER_LTE,
  CODE_NUMBER_MULTIPLE_OF,
  CODE_TYPE,
  MESSAGE_NUMBER_GT,
  MESSAGE_NUMBER_GTE,
  MESSAGE_NUMBER_LT,
  MESSAGE_NUMBER_LTE,
  MESSAGE_NUMBER_MULTIPLE_OF,
  MESSAGE_NUMBER_TYPE,
  TYPE_NUMBER,
} from './constants';
import { ValidationError } from '../ValidationError';

export class NumberShape extends Shape<number> {
  constructor(protected options?: InputConstraintOptionsOrMessage) {
    super(false);
  }

  /**
   * Constrains the number to be greater than zero.
   *
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  positive(options?: OutputConstraintOptionsOrMessage): this {
    return this.gt(0, options);
  }

  /**
   * Constrains the number to be less than zero.
   *
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  negative(options?: OutputConstraintOptionsOrMessage): this {
    return this.lt(0, options);
  }

  /**
   * Constrains the number to be greater than the value.
   *
   * @param value The exclusive minimum value.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  gt(value: number, options?: OutputConstraintOptionsOrMessage): this {
    return addConstraint(this, CODE_NUMBER_GT, options, output => {
      if (output <= value) {
        return raiseIssue(output, CODE_NUMBER_GT, value, options, MESSAGE_NUMBER_GT);
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
  lt(value: number, options?: OutputConstraintOptionsOrMessage): this {
    return addConstraint(this, CODE_NUMBER_LT, options, output => {
      if (output >= value) {
        return raiseIssue(output, CODE_NUMBER_LT, value, options, MESSAGE_NUMBER_LT);
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
  gte(value: number, options?: OutputConstraintOptionsOrMessage): this {
    return addConstraint(this, CODE_NUMBER_GTE, options, output => {
      if (output < value) {
        return raiseIssue(output, CODE_NUMBER_GTE, value, options, MESSAGE_NUMBER_GTE);
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
  lte(value: number, options?: OutputConstraintOptionsOrMessage): this {
    return addConstraint(this, CODE_NUMBER_LTE, options, output => {
      if (output > value) {
        return raiseIssue(output, CODE_NUMBER_LTE, value, options, MESSAGE_NUMBER_LTE);
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
  multipleOf(divisor: number, options?: OutputConstraintOptionsOrMessage): this {
    return addConstraint(this, CODE_NUMBER_MULTIPLE_OF, options, output => {
      if (output % divisor !== 0) {
        return raiseIssue(output, CODE_NUMBER_MULTIPLE_OF, divisor, options, MESSAGE_NUMBER_MULTIPLE_OF);
      }
    });
  }

  safeParse(input: unknown, options?: ParserOptions): number | ValidationError {
    const { _applyConstraints } = this;

    if (!isFinite(input)) {
      return raiseIssue(input, CODE_TYPE, TYPE_NUMBER, this.options, MESSAGE_NUMBER_TYPE);
    }
    if (_applyConstraints !== null) {
      return returnOrRaiseIssues(input, _applyConstraints(input, options, null));
    }
    return input;
  }
}
