/**
 * The plugin that enhances {@linkcode doubter/core!NumberShape} with additional methods.
 *
 * ```ts
 * import { NumberShape } from 'doubter/core';
 * import enhanceNumberShape from 'doubter/plugin/rich-numbers';
 *
 * enhanceNumberShape(NumberShape.prototype);
 * ```
 *
 * @module doubter/plugin/rich-numbers
 */

import {
  CODE_NUMBER_FINITE,
  CODE_NUMBER_GT,
  CODE_NUMBER_GTE,
  CODE_NUMBER_INTEGER,
  CODE_NUMBER_LT,
  CODE_NUMBER_LTE,
  CODE_NUMBER_MULTIPLE,
  MESSAGE_NUMBER_FINITE,
  MESSAGE_NUMBER_GT,
  MESSAGE_NUMBER_GTE,
  MESSAGE_NUMBER_INTEGER,
  MESSAGE_NUMBER_LT,
  MESSAGE_NUMBER_LTE,
  MESSAGE_NUMBER_MULTIPLE,
} from '../constants';
import { IssueOptions, Message, NumberShape } from '../core';
import { pushIssue } from '../internal';
import { createIssueFactory, extractOptions } from '../utils';

export interface MultipleOptions extends IssueOptions {
  /**
   * By default, {@linkcode doubter/core!NumberShape#multiple NumberShape.multiple} uses
   * [the modulo operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder) which
   * may produce unexpected results when used with floating point numbers. This happens because of
   * [the way numbers are represented by IEEE 754](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html).
   *
   * For example, for small dividers such as 0.01 the result of the division is usually not integer (even when it should
   * be integer). If you need to use fractional dividers set this option to some positive integer to have `multiple`
   * validated using this formula:
   *
   * ```
   * Math.abs(Math.round(value / divisor) - value / divisor) < Math.pow(10, -precision)
   * ```
   */
  precision?: number;
}

declare module '../core' {
  export interface NumberShape {
    /**
     * Constrains the number to be a finite number.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-numbers!}
     */
    finite(options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be an integer.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-numbers!}
     */
    integer(options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be greater than zero.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-numbers!}
     */
    positive(options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be less than zero.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-numbers!}
     */
    negative(options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be less or equal to zero.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-numbers!}
     */
    nonPositive(options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be greater or equal to zero.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-numbers!}
     */
    nonNegative(options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be greater than the value.
     *
     * @param value The exclusive minimum value.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-numbers!}
     */
    gt(value: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be less than the value.
     *
     * @param value The exclusive maximum value.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-numbers!}
     */
    lt(value: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be greater than or equal to the value.
     *
     * @param value The inclusive minimum value.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-numbers!}
     */
    gte(value: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be less than or equal to the value.
     *
     * @param value The inclusive maximum value.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-numbers!}
     */
    lte(value: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be greater than or equal to the value.
     *
     * @param value The inclusive minimum value.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @alias {@linkcode gte}
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-numbers!}
     */
    min(value: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be less than or equal to the value.
     *
     * @param value The inclusive maximum value.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @alias {@linkcode lte}
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-numbers!}
     */
    max(value: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be a multiple of the divisor.
     *
     * @param divisor The positive number by which the input should be divisible without a remainder.
     * @param options The check options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-numbers!}
     */
    multiple(divisor: number, options?: MultipleOptions | Message): this;

    /**
     * Number must be between `Number.MIN_SAFE_INTEGER` and `Number.MAX_SAFE_INTEGER`.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-numbers!}
     */
    safe(options?: IssueOptions | Message): this;
  }
}

/**
 * Enhances {@linkcode doubter/core!NumberShape} with additional methods.
 */
export default function (prototype: NumberShape): void {
  const { abs, round } = Math;
  const { isFinite, isInteger } = Number;

  prototype.finite = function (options) {
    const issueFactory = createIssueFactory(CODE_NUMBER_FINITE, MESSAGE_NUMBER_FINITE, options, undefined);

    return this.use(
      next => (input, output, options, issues) => {
        if (!isFinite(output)) {
          issues = pushIssue(issues, issueFactory(output, options));

          if (options.earlyReturn) {
            return issues;
          }
        }
        return next(input, output, options, issues);
      },
      { type: CODE_NUMBER_FINITE }
    );
  };

  prototype.integer = function (options) {
    const issueFactory = createIssueFactory(CODE_NUMBER_INTEGER, MESSAGE_NUMBER_INTEGER, options, undefined);

    return this.use(
      next => (input, output, options, issues) => {
        if (!isInteger(output)) {
          issues = pushIssue(issues, issueFactory(output, options));

          if (options.earlyReturn) {
            return issues;
          }
        }
        return next(input, output, options, issues);
      },
      { type: CODE_NUMBER_INTEGER }
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

  prototype.gt = function (value, options) {
    const issueFactory = createIssueFactory(CODE_NUMBER_GT, MESSAGE_NUMBER_GT, options, value);

    return this.use(
      next => (input, output, options, issues) => {
        if (output <= value) {
          issues = pushIssue(issues, issueFactory(output, options));

          if (options.earlyReturn) {
            return issues;
          }
        }
        return next(input, output, options, issues);
      },
      { type: CODE_NUMBER_GT, param: value }
    );
  };

  prototype.lt = function (value, options) {
    const issueFactory = createIssueFactory(CODE_NUMBER_LT, MESSAGE_NUMBER_LT, options, value);

    return this.use(
      next => (input, output, options, issues) => {
        if (output >= value) {
          issues = pushIssue(issues, issueFactory(output, options));

          if (options.earlyReturn) {
            return issues;
          }
        }
        return next(input, output, options, issues);
      },
      { type: CODE_NUMBER_LT, param: value }
    );
  };

  prototype.gte = function (value, options) {
    const issueFactory = createIssueFactory(CODE_NUMBER_GTE, MESSAGE_NUMBER_GTE, options, value);

    return this.use(
      next => (input, output, options, issues) => {
        if (output < value) {
          issues = pushIssue(issues, issueFactory(output, options));

          if (options.earlyReturn) {
            return issues;
          }
        }
        return next(input, output, options, issues);
      },
      { type: CODE_NUMBER_GTE, param: value }
    );
  };

  prototype.lte = function (value, options) {
    const issueFactory = createIssueFactory(CODE_NUMBER_LTE, MESSAGE_NUMBER_LTE, options, value);

    return this.use(
      next => (input, output, options, issues) => {
        if (output > value) {
          issues = pushIssue(issues, issueFactory(output, options));

          if (options.earlyReturn) {
            return issues;
          }
        }
        return next(input, output, options, issues);
      },
      { type: CODE_NUMBER_LTE, param: value }
    );
  };

  prototype.min = prototype.gte;

  prototype.max = prototype.lte;

  prototype.multiple = function (divisor, options) {
    const { precision } = extractOptions(options);

    const epsilon = precision !== undefined ? Math.pow(10, -precision) : -1;

    const issueFactory = createIssueFactory(CODE_NUMBER_MULTIPLE, MESSAGE_NUMBER_MULTIPLE, options, divisor);

    return this.use(
      next => (input, output, options, issues) => {
        if (epsilon !== -1 ? abs(round(output / divisor) - output / divisor) > epsilon : output % divisor !== 0) {
          issues = pushIssue(issues, issueFactory(output, options));

          if (options.earlyReturn) {
            return issues;
          }
        }
        return next(input, output, options, issues);
      },
      { type: CODE_NUMBER_MULTIPLE, param: divisor }
    );
  };

  prototype.safe = function (options) {
    return this.min(Number.MIN_SAFE_INTEGER, options).max(Number.MAX_SAFE_INTEGER, options);
  };
}
