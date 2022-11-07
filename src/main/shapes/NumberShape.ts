import { Shape } from './Shape';
import { ApplyResult, ConstraintOptions, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { addCheck, createIssueFactory } from '../utils';
import {
  CODE_NUMBER_DIVISOR,
  CODE_NUMBER_FINITE,
  CODE_NUMBER_GT,
  CODE_NUMBER_GTE,
  CODE_NUMBER_LT,
  CODE_NUMBER_LTE,
  CODE_TYPE,
  MESSAGE_NUMBER_DIVISOR,
  MESSAGE_NUMBER_FINITE,
  MESSAGE_NUMBER_GT,
  MESSAGE_NUMBER_GTE,
  MESSAGE_NUMBER_LT,
  MESSAGE_NUMBER_LTE,
  MESSAGE_NUMBER_TYPE,
  TYPE_NUMBER,
} from './constants';

export class NumberShape extends Shape<number> {
  protected _issueFactory;

  constructor(options?: TypeConstraintOptions | Message) {
    super();
    this._issueFactory = createIssueFactory(options, CODE_TYPE, MESSAGE_NUMBER_TYPE, TYPE_NUMBER);
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
    const issueFactory = createIssueFactory(options, CODE_NUMBER_GT, MESSAGE_NUMBER_GT, value);

    return addCheck(this, CODE_NUMBER_GT, options, output => {
      if (output <= value) {
        return issueFactory(output);
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
    const issueFactory = createIssueFactory(options, CODE_NUMBER_LT, MESSAGE_NUMBER_LT, value);

    return addCheck(this, CODE_NUMBER_LT, options, output => {
      if (output >= value) {
        return issueFactory(output);
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
    const issueFactory = createIssueFactory(options, CODE_NUMBER_GTE, MESSAGE_NUMBER_GTE, value);

    return addCheck(this, CODE_NUMBER_GTE, options, output => {
      if (output < value) {
        return issueFactory(output);
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
    const issueFactory = createIssueFactory(options, CODE_NUMBER_LTE, MESSAGE_NUMBER_LTE, value);

    return addCheck(this, CODE_NUMBER_LTE, options, output => {
      if (output > value) {
        return issueFactory(output);
      }
    });
  }

  /**
   * Constrains the number to be a multiple of the divisor.
   *
   * @param value The number by which the input should be divisible without a remainder.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  divisor(value: number, options?: ConstraintOptions | Message): this {
    const issueFactory = createIssueFactory(options, CODE_NUMBER_DIVISOR, MESSAGE_NUMBER_DIVISOR, value);

    return addCheck(this, CODE_NUMBER_DIVISOR, options, output => {
      if (output % value !== 0) {
        return issueFactory(output);
      }
    });
  }

  /**
   * Constrains the number to be finite and rejects `Infinity` and `NaN` values.
   *
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  finite(options?: ConstraintOptions | Message): this {
    const issueFactory = createIssueFactory(options, CODE_NUMBER_FINITE, MESSAGE_NUMBER_FINITE);

    return addCheck(this, CODE_NUMBER_FINITE, options, output => {
      if (output !== output || output === Infinity || output === -Infinity) {
        return issueFactory(output);
      }
    });
  }

  /**
   * Constrains the number to be an integer and rejects `Infinity` and `NaN` values.
   *
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  integer(options?: ConstraintOptions | Message): this {
    return this.divisor(1, options);
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<number> {
    const { applyChecks } = this;

    if (typeof input !== 'number') {
      return [this._issueFactory(input)];
    }
    if (applyChecks !== null) {
      return applyChecks(input, null, options);
    }
    return null;
  }
}
