import { Shape } from './Shape';
import { ApplyResult, ConstraintOptions, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { addCheck, createCheckConfig, raiseIssue } from '../shape-utils';
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
import { isFinite } from '../lang-utils';

export class NumberShape extends Shape<number> {
  protected _typeCheckConfig;

  constructor(options?: TypeConstraintOptions | Message) {
    super(false);
    this._typeCheckConfig = createCheckConfig(options, CODE_TYPE, MESSAGE_NUMBER_TYPE, TYPE_NUMBER);
  }

  /**
   * Constrains the number to be greater than zero.
   *
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  positive(options?: ConstraintOptions | Message): this {
    return this.gt(0, options);
  }

  /**
   * Constrains the number to be less than zero.
   *
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  negative(options?: ConstraintOptions | Message): this {
    return this.lt(0, options);
  }

  /**
   * Constrains the number to be greater than the value.
   *
   * @param value The exclusive minimum value.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  gt(value: number, options?: ConstraintOptions | Message): this {
    const checkConfig = createCheckConfig(options, CODE_NUMBER_GT, MESSAGE_NUMBER_GT, value);

    return addCheck(this, CODE_NUMBER_GT, options, input => {
      if (input <= value) {
        return raiseIssue(checkConfig, input);
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
  lt(value: number, options?: ConstraintOptions | Message): this {
    const checkConfig = createCheckConfig(options, CODE_NUMBER_LT, MESSAGE_NUMBER_LT, value);

    return addCheck(this, CODE_NUMBER_LT, options, input => {
      if (input >= value) {
        return raiseIssue(checkConfig, input);
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
  gte(value: number, options?: ConstraintOptions | Message): this {
    const checkConfig = createCheckConfig(options, CODE_NUMBER_GTE, MESSAGE_NUMBER_GTE, value);

    return addCheck(this, CODE_NUMBER_GTE, options, input => {
      if (input < value) {
        return raiseIssue(checkConfig, input);
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
  lte(value: number, options?: ConstraintOptions | Message): this {
    const checkConfig = createCheckConfig(options, CODE_NUMBER_LTE, MESSAGE_NUMBER_LTE, value);

    return addCheck(this, CODE_NUMBER_LTE, options, input => {
      if (input > value) {
        return raiseIssue(checkConfig, input);
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
  multipleOf(divisor: number, options?: ConstraintOptions | Message): this {
    const checkConfig = createCheckConfig(options, CODE_NUMBER_MULTIPLE_OF, MESSAGE_NUMBER_MULTIPLE_OF, divisor);

    return addCheck(this, CODE_NUMBER_MULTIPLE_OF, options, input => {
      if (input % divisor !== 0) {
        return raiseIssue(checkConfig, input);
      }
    });
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<number> {
    const { applyChecks } = this;

    if (!isFinite(input)) {
      return raiseIssue(this._typeCheckConfig, input);
    }
    if (applyChecks !== null) {
      return applyChecks(input, null, options);
    }
    return null;
  }
}
