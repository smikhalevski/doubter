/**
 * The plugin that enhances {@link core!NumberShape NumberShape} with additional methods.
 *
 * ```ts
 * import { NumberShape } from 'doubter/core';
 * import enableNumberEssentials from 'doubter/plugin/number-essentials';
 *
 * enableNumberEssentials(NumberShape);
 * ```
 *
 * @module plugin/number-essentials
 */

import {
  CODE_NUMBER_FINITE,
  CODE_NUMBER_GT,
  CODE_NUMBER_GTE,
  CODE_NUMBER_INT,
  CODE_NUMBER_LT,
  CODE_NUMBER_LTE,
  CODE_NUMBER_MULTIPLE_OF,
} from '../constants';
import { IssueOptions, Message, NumberShape } from '../core';
import { Any } from '../types';
import { createIssueFactory, extractOptions } from '../utils';

export interface MultipleOfOptions extends IssueOptions {
  /**
   * The non-negative integer, the number of decimal digits that are considered significant for floating number
   * comparison.
   *
   * By default, {@link core!NumberShape.multipleOf NumberShape.multipleOf} uses
   * [the modulo operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder) which
   * may produce unexpected results when used with floating point numbers. This happens because of
   * [the way numbers are represented by IEEE 754](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html).
   *
   * For example, for small dividers such as 0.01 the result of the division is usually not integer (even when it should
   * be integer). If you need to use fractional dividers set this option to some positive integer to have `multipleOf`
   * validated using this formula:
   *
   * ```
   * Math.abs(Math.round(value / divisor) - value / divisor) <= Math.pow(10, -precision)
   * ```
   */
  precision?: number;
}

declare module '../core' {
  export interface Messages {
    /**
     * @default "Must be a finite number"
     */
    'number.finite': Message | Any;

    /**
     * @default "Must be an integer"
     */
    'number.int': Message | Any;

    /**
     * @default "Must be greater than %s"
     */
    'number.gt': Message | Any;

    /**
     * @default "Must be greater than or equal to %s"
     */
    'number.gte': Message | Any;

    /**
     * @default "Must be less than %s"
     */
    'number.lt': Message | Any;

    /**
     * @default "Must be less than or equal to %s"
     */
    'number.lte': Message | Any;

    /**
     * @default "Must be a multiple of %s"
     */
    'number.multipleOf': Message | Any;
  }

  export interface NumberShape {
    /**
     * Constrains the number to be a finite number.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/number-essentials! plugin/number-essentials}
     */
    finite(options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be an integer.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/number-essentials! plugin/number-essentials}
     */
    int(options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be greater than zero.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/number-essentials! plugin/number-essentials}
     */
    positive(options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be less than zero.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/number-essentials! plugin/number-essentials}
     */
    negative(options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be less or equal to zero.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/number-essentials! plugin/number-essentials}
     */
    nonPositive(options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be greater or equal to zero.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/number-essentials! plugin/number-essentials}
     */
    nonNegative(options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be between the inclusive minimum and maximum.
     *
     * @param minValue The inclusive minimum value.
     * @param maxValue The inclusive maximum value.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/number-essentials! plugin/number-essentials}
     */
    between(minValue: number, maxValue: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be greater than the value.
     *
     * @param value The exclusive minimum value.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/number-essentials! plugin/number-essentials}
     */
    gt(value: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be less than the value.
     *
     * @param value The exclusive maximum value.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/number-essentials! plugin/number-essentials}
     */
    lt(value: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be greater than or equal to the value.
     *
     * @param value The inclusive minimum value.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/number-essentials! plugin/number-essentials}
     */
    gte(value: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be less than or equal to the value.
     *
     * @param value The inclusive maximum value.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/number-essentials! plugin/number-essentials}
     */
    lte(value: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be greater than or equal to the value.
     *
     * @param value The inclusive minimum value.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @alias {@link NumberShape.gte}
     * @group Plugin Methods
     * @plugin {@link plugin/number-essentials! plugin/number-essentials}
     */
    min(value: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be less than or equal to the value.
     *
     * @param value The inclusive maximum value.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @alias {@link NumberShape.lte}
     * @group Plugin Methods
     * @plugin {@link plugin/number-essentials! plugin/number-essentials}
     */
    max(value: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be a multiple of the divisor.
     *
     * @param divisor The positive number by which the input should be divisible without a remainder.
     * @param options The check options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/number-essentials! plugin/number-essentials}
     */
    multipleOf(divisor: number, options?: MultipleOfOptions | Message): this;

    /**
     * Number must be between `Number.MIN_SAFE_INTEGER` and `Number.MAX_SAFE_INTEGER`.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/number-essentials! plugin/number-essentials}
     */
    safe(options?: IssueOptions | Message): this;
  }
}

/**
 * Enhances {@link core!NumberShape NumberShape} with additional methods.
 */
export default function enableNumberEssentials(ctor: typeof NumberShape): void {
  const { messages, prototype } = ctor;

  messages[CODE_NUMBER_FINITE] = 'Must be a finite number';
  messages[CODE_NUMBER_INT] = 'Must be an integer';
  messages[CODE_NUMBER_GT] = 'Must be greater than %s';
  messages[CODE_NUMBER_GTE] = 'Must be greater than or equal to %s';
  messages[CODE_NUMBER_LT] = 'Must be less than %s';
  messages[CODE_NUMBER_LTE] = 'Must be less than or equal to %s';
  messages[CODE_NUMBER_MULTIPLE_OF] = 'Must be a multiple of %s';

  prototype.finite = function (options) {
    const issueFactory = createIssueFactory(CODE_NUMBER_FINITE, ctor.messages[CODE_NUMBER_FINITE], options, undefined);

    return this.addOperation(
      (value, param, options) => {
        if (isFinite(value)) {
          return null;
        }
        return [issueFactory(value, options)];
      },
      { type: CODE_NUMBER_FINITE }
    );
  };

  prototype.int = function (options) {
    const { isInteger } = Number;
    const issueFactory = createIssueFactory(CODE_NUMBER_INT, ctor.messages[CODE_NUMBER_INT], options, undefined);

    return this.addOperation(
      (value, param, options) => {
        if (isInteger(value)) {
          return null;
        }
        return [issueFactory(value, options)];
      },
      { type: CODE_NUMBER_INT }
    );
  };

  prototype.positive = function (options) {
    return this.gt(0, options);
  };

  prototype.negative = function (options) {
    return this.lt(0, options);
  };

  prototype.nonPositive = function (options) {
    return this.lte(0, options);
  };

  prototype.nonNegative = function (options) {
    return this.gte(0, options);
  };

  prototype.between = function (minValue, maxValue, options) {
    return this.gte(minValue, options).lte(maxValue, options);
  };

  prototype.gt = function (value, options) {
    const issueFactory = createIssueFactory(CODE_NUMBER_GT, ctor.messages[CODE_NUMBER_GT], options, value);

    return this.addOperation(
      (value, param, options) => {
        if (value > param) {
          return null;
        }
        return [issueFactory(value, options)];
      },
      { type: CODE_NUMBER_GT, param: value }
    );
  };

  prototype.lt = function (value, options) {
    const issueFactory = createIssueFactory(CODE_NUMBER_LT, ctor.messages[CODE_NUMBER_LT], options, value);

    return this.addOperation(
      (value, param, options) => {
        if (value < param) {
          return null;
        }
        return [issueFactory(value, options)];
      },
      { type: CODE_NUMBER_LT, param: value }
    );
  };

  prototype.gte = function (value, options) {
    const issueFactory = createIssueFactory(CODE_NUMBER_GTE, ctor.messages[CODE_NUMBER_GTE], options, value);

    return this.addOperation(
      (value, param, options) => {
        if (value >= param) {
          return null;
        }
        return [issueFactory(value, options)];
      },
      { type: CODE_NUMBER_GTE, param: value }
    );
  };

  prototype.lte = function (value, options) {
    const issueFactory = createIssueFactory(CODE_NUMBER_LTE, ctor.messages[CODE_NUMBER_LTE], options, value);

    return this.addOperation(
      (value, param, options) => {
        if (value <= param) {
          return null;
        }
        return [issueFactory(value, options)];
      },
      { type: CODE_NUMBER_LTE, param: value }
    );
  };

  prototype.min = prototype.gte;

  prototype.max = prototype.lte;

  prototype.multipleOf = function (divisor, options) {
    const { abs, round } = Math;
    const { precision } = extractOptions(options);

    const epsilon = precision !== undefined ? Math.pow(10, -precision) : -1;

    const issueFactory = createIssueFactory(
      CODE_NUMBER_MULTIPLE_OF,
      ctor.messages[CODE_NUMBER_MULTIPLE_OF],
      options,
      divisor
    );

    return this.addOperation(
      (value, param, options) => {
        if (epsilon !== -1 ? abs(round(value / param) - value / param) <= epsilon : value % param === 0) {
          return null;
        }
        return [issueFactory(value, options)];
      },
      { type: CODE_NUMBER_MULTIPLE_OF, param: divisor }
    );
  };

  prototype.safe = function (options) {
    return this.min(Number.MIN_SAFE_INTEGER, options).max(Number.MAX_SAFE_INTEGER, options);
  };
}
