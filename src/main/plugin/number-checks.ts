/**
 * The plugin that enhances {@linkcode doubter/core!NumberShape} with additional checks.
 *
 * ```ts
 * import numberChecks from 'doubter/plugin/number-checks';
 *
 * numberChecks();
 * ```
 *
 * @module doubter/plugin/number-checks
 */

import {
  CODE_NUMBER_GT,
  CODE_NUMBER_GTE,
  CODE_NUMBER_LT,
  CODE_NUMBER_LTE,
  CODE_NUMBER_MULTIPLE,
  MESSAGE_NUMBER_GT,
  MESSAGE_NUMBER_GTE,
  MESSAGE_NUMBER_LT,
  MESSAGE_NUMBER_LTE,
  MESSAGE_NUMBER_MULTIPLE,
} from '../constants';
import { ConstraintOptions, Message, NumberShape } from '../core';
import { pushIssue } from '../internal';
import { createIssueFactory, extractOptions } from '../utils';

const { abs, round } = Math;

export interface MultipleOptions extends ConstraintOptions {
  /**
   * By default, {@linkcode NumberShape#multiple NumberShape.multiple} uses
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
     * `true` if the shape constrains input values to a finite number, or `false` otherwise.
     *
     * @group Plugin Properties
     * @plugin {@link doubter/plugin/number-checks!}
     */
    readonly isFinite: boolean;

    /**
     * `true` if the shape constrains input values to an integer number, or `false` otherwise.
     *
     * @group Plugin Properties
     * @plugin {@link doubter/plugin/number-checks!}
     */
    readonly isInteger: boolean;

    /**
     * Constrains the number to be greater than zero.
     *
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/number-checks!}
     */
    positive(options?: ConstraintOptions | Message): this;

    /**
     * Constrains the number to be less than zero.
     *
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/number-checks!}
     */
    negative(options?: ConstraintOptions | Message): this;

    /**
     * Constrains the number to be less or equal to zero.
     *
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/number-checks!}
     */
    nonPositive(options?: ConstraintOptions | Message): this;

    /**
     * Constrains the number to be greater or equal to zero.
     *
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/number-checks!}
     */
    nonNegative(options?: ConstraintOptions | Message): this;

    /**
     * Constrains the number to be greater than the value.
     *
     * @param value The exclusive minimum value.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/number-checks!}
     */
    gt(value: number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the number to be less than the value.
     *
     * @param value The exclusive maximum value.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/number-checks!}
     */
    lt(value: number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the number to be greater than or equal to the value.
     *
     * @param value The inclusive minimum value.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/number-checks!}
     */
    gte(value: number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the number to be less than or equal to the value.
     *
     * @param value The inclusive maximum value.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/number-checks!}
     */
    lte(value: number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the number to be greater than or equal to the value.
     *
     * @param value The inclusive minimum value.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @alias {@linkcode gte}
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/number-checks!}
     */
    min(value: number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the number to be less than or equal to the value.
     *
     * @param value The inclusive maximum value.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @alias {@linkcode lte}
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/number-checks!}
     */
    max(value: number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the number to be a multiple of the divisor.
     *
     * @param divisor The positive number by which the input should be divisible without a remainder.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/number-checks!}
     */
    multiple(divisor: number, options?: ConstraintOptions | Message): this;

    /**
     * Number must be between `Number.MIN_SAFE_INTEGER` and `Number.MAX_SAFE_INTEGER`.
     *
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/number-checks!}
     */
    safe(options?: ConstraintOptions | Message): this;
  }
}

/**
 * Enhances {@linkcode doubter/core!NumberShape} with additional checks.
 */
export default function () {
  Object.defineProperties(NumberShape.prototype, {
    isFinite: {
      configurable: true,
      get(this: NumberShape) {
        return this._typePredicate === Number.isFinite || this.isInteger;
      },
    },

    isInteger: {
      configurable: true,
      get(this: NumberShape) {
        return this._typePredicate === Number.isInteger;
      },
    },
  });

  NumberShape.prototype.positive = appendPositiveCheck;
  NumberShape.prototype.negative = appendNegativeCheck;
  NumberShape.prototype.nonPositive = appendNonPositiveCheck;
  NumberShape.prototype.nonNegative = appendNonNegativeCheck;
  NumberShape.prototype.gt = appendGtCheck;
  NumberShape.prototype.lt = appendLtCheck;
  NumberShape.prototype.gte = appendGteCheck;
  NumberShape.prototype.lte = appendLteCheck;
  NumberShape.prototype.min = appendGteCheck;
  NumberShape.prototype.max = appendLteCheck;
  NumberShape.prototype.multiple = appendMultipleCheck;
  NumberShape.prototype.safe = appendSafeCheck;
}

function appendPositiveCheck(this: NumberShape, options?: ConstraintOptions | Message): NumberShape {
  return this.gt(0, options);
}

function appendNegativeCheck(this: NumberShape, options?: ConstraintOptions | Message): NumberShape {
  return this.lt(0, options);
}

function appendNonPositiveCheck(this: NumberShape, options?: ConstraintOptions | Message): NumberShape {
  return this.lte(0, options);
}

function appendNonNegativeCheck(this: NumberShape, options?: ConstraintOptions | Message): NumberShape {
  return this.gte(0, options);
}

function appendGtCheck(this: NumberShape, value: number, options?: ConstraintOptions | Message): NumberShape {
  const issueFactory = createIssueFactory(CODE_NUMBER_GT, MESSAGE_NUMBER_GT, options, value);

  return this._appendOperation({
    type: CODE_NUMBER_GT,
    param: value,
    compile: next => (input, output, options, issues) => {
      if (output <= value) {
        issues = pushIssue(issues, issueFactory(output, options));

        if (!options.verbose) {
          return issues;
        }
      }
      return next(input, output, options, issues);
    },
  });
}

function appendLtCheck(this: NumberShape, value: number, options?: ConstraintOptions | Message): NumberShape {
  const issueFactory = createIssueFactory(CODE_NUMBER_LT, MESSAGE_NUMBER_LT, options, value);

  return this._appendOperation({
    type: CODE_NUMBER_LT,
    param: value,
    compile: next => (input, output, options, issues) => {
      if (output >= value) {
        issues = pushIssue(issues, issueFactory(output, options));

        if (!options.verbose) {
          return issues;
        }
      }
      return next(input, output, options, issues);
    },
  });
}

function appendGteCheck(this: NumberShape, value: number, options?: ConstraintOptions | Message): NumberShape {
  const issueFactory = createIssueFactory(CODE_NUMBER_GTE, MESSAGE_NUMBER_GTE, options, value);

  return this._appendOperation({
    type: CODE_NUMBER_GTE,
    param: value,
    compile: next => (input, output, options, issues) => {
      if (output < value) {
        issues = pushIssue(issues, issueFactory(output, options));

        if (!options.verbose) {
          return issues;
        }
      }
      return next(input, output, options, issues);
    },
  });
}

function appendLteCheck(this: NumberShape, value: number, options?: ConstraintOptions | Message): NumberShape {
  const issueFactory = createIssueFactory(CODE_NUMBER_LTE, MESSAGE_NUMBER_LTE, options, value);

  return this._appendOperation({
    type: CODE_NUMBER_LTE,
    param: value,
    compile: next => (input, output, options, issues) => {
      if (output > value) {
        issues = pushIssue(issues, issueFactory(output, options));

        if (!options.verbose) {
          return issues;
        }
      }
      return next(input, output, options, issues);
    },
  });
}

function appendMultipleCheck(this: NumberShape, divisor: number, options?: MultipleOptions | Message): NumberShape {
  const { precision } = extractOptions(options);

  const epsilon = precision !== undefined ? Math.pow(10, -precision) : -1;

  const issueFactory = createIssueFactory(CODE_NUMBER_MULTIPLE, MESSAGE_NUMBER_MULTIPLE, options, divisor);

  return this._appendOperation({
    type: CODE_NUMBER_MULTIPLE,
    param: divisor,
    compile: next => (input, output, options, issues) => {
      if (epsilon !== -1 ? abs(round(output / divisor) - output / divisor) < epsilon : output % divisor !== 0) {
        issues = pushIssue(issues, issueFactory(output, options));

        if (!options.verbose) {
          return issues;
        }
      }
      return next(input, output, options, issues);
    },
  });
}

function appendSafeCheck(this: NumberShape, options?: ConstraintOptions | Message): NumberShape {
  return this.min(Number.MIN_SAFE_INTEGER, options).max(Number.MAX_SAFE_INTEGER, options);
}
