/**
 * @module doubter/plugin/number-checks
 */

import {
  CODE_NUMBER_GT,
  CODE_NUMBER_GTE,
  CODE_NUMBER_LT,
  CODE_NUMBER_LTE,
  CODE_NUMBER_MULTIPLE_OF,
  MESSAGE_NUMBER_GT,
  MESSAGE_NUMBER_GTE,
  MESSAGE_NUMBER_LT,
  MESSAGE_NUMBER_LTE,
  MESSAGE_NUMBER_MULTIPLE_OF,
} from '../constants';
import { ConstraintOptions, Message, NumberShape } from '../core';
import { addCheck, createIssueFactory } from '../utils';

declare module '../core' {
  export interface NumberShape {
    /**
     * `true` if the shape constrains a finite number, or `false` otherwise.
     *
     * @group Plugin Properties
     * @plugin {@link doubter/plugin/number-checks!}
     */
    readonly isFinite: boolean;

    /**
     * `true` if the shape constrains an integer number, or `false` otherwise.
     *
     * @group Plugin Properties
     * @plugin {@link doubter/plugin/number-checks!}
     */
    readonly isInteger: boolean;

    /**
     * The inclusive minimum value set via {@linkcode gte} or {@linkcode min}, or `undefined` if there's no such value.
     *
     * @group Plugin Properties
     * @plugin {@link doubter/plugin/number-checks!}
     */
    readonly minValue: number | undefined;

    /**
     * The inclusive maximum value set via {@linkcode lte} or {@linkcode max}, or `undefined` if there's no such value.
     *
     * @group Plugin Properties
     * @plugin {@link doubter/plugin/number-checks!}
     */
    readonly maxValue: number | undefined;

    /**
     * The exclusive minimum value set via {@linkcode gt}, or `undefined` if there's no such value.
     *
     * @group Plugin Properties
     * @plugin {@link doubter/plugin/number-checks!}
     */
    readonly exclusiveMinValue: number | undefined;

    /**
     * The exclusive maximum value set via {@linkcode lt}, or `undefined` if there's no such value.
     *
     * @group Plugin Properties
     * @plugin {@link doubter/plugin/number-checks!}
     */
    readonly exclusiveMaxValue: number | undefined;

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
     * This constraint uses the
     * [modulo operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder) which may
     * produce unexpected results when used with floating point numbers. Unexpected results happen because of
     * [the way numbers are represented by IEEE 754](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html).
     *
     * Use a custom check to constrain input to be a multiple of a real number:
     *
     * ```ts
     * const precision = 100;
     *
     * d.number().refine(
     *   (value, param) => Math.trunc(value * precision) % Math.trunc(param * precision) === 0,
     *   { param: 0.05 }
     * );
     * ```
     *
     * @param value The positive number by which the input should be divisible without a remainder.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/number-checks!}
     */
    multipleOf(value: number, options?: ConstraintOptions | Message): this;

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

export default function () {
  const prototype = NumberShape.prototype;

  Object.defineProperties(prototype, {
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

    minValue: {
      configurable: true,
      get(this: NumberShape) {
        return this.getCheck(CODE_NUMBER_GTE)?.param;
      },
    },

    maxValue: {
      configurable: true,
      get(this: NumberShape) {
        return this.getCheck(CODE_NUMBER_LTE)?.param;
      },
    },

    exclusiveMinValue: {
      configurable: true,
      get(this: NumberShape) {
        return this.getCheck(CODE_NUMBER_GT)?.param;
      },
    },

    exclusiveMaxValue: {
      configurable: true,
      get(this: NumberShape) {
        return this.getCheck(CODE_NUMBER_LT)?.param;
      },
    },
  });

  prototype.positive = positive;
  prototype.negative = negative;
  prototype.nonPositive = nonPositive;
  prototype.nonNegative = nonNegative;
  prototype.gt = gt;
  prototype.lt = lt;
  prototype.gte = gte;
  prototype.lte = lte;
  prototype.min = gte;
  prototype.max = lte;
  prototype.multipleOf = multipleOf;
  prototype.safe = safe;
}

function positive(this: NumberShape, options?: ConstraintOptions | Message): NumberShape {
  return this.gt(0, options);
}

function negative(this: NumberShape, options?: ConstraintOptions | Message): NumberShape {
  return this.lt(0, options);
}

function nonPositive(this: NumberShape, options?: ConstraintOptions | Message): NumberShape {
  return this.lte(0, options);
}

function nonNegative(this: NumberShape, options?: ConstraintOptions | Message): NumberShape {
  return this.gte(0, options);
}

function gt(this: NumberShape, value: number, options?: ConstraintOptions | Message): NumberShape {
  const issueFactory = createIssueFactory(CODE_NUMBER_GT, MESSAGE_NUMBER_GT, options, value);

  return addCheck(this, CODE_NUMBER_GT, value, (input, param, options) => {
    if (input <= param) {
      return issueFactory(input, options);
    }
  });
}

function lt(this: NumberShape, value: number, options?: ConstraintOptions | Message): NumberShape {
  const issueFactory = createIssueFactory(CODE_NUMBER_LT, MESSAGE_NUMBER_LT, options, value);

  return addCheck(this, CODE_NUMBER_LT, value, (input, param, options) => {
    if (input >= param) {
      return issueFactory(input, options);
    }
  });
}

function gte(this: NumberShape, value: number, options?: ConstraintOptions | Message): NumberShape {
  const issueFactory = createIssueFactory(CODE_NUMBER_GTE, MESSAGE_NUMBER_GTE, options, value);

  return addCheck(this, CODE_NUMBER_GTE, value, (input, param, options) => {
    if (input < param) {
      return issueFactory(input, options);
    }
  });
}

function lte(this: NumberShape, value: number, options?: ConstraintOptions | Message): NumberShape {
  const issueFactory = createIssueFactory(CODE_NUMBER_LTE, MESSAGE_NUMBER_LTE, options, value);

  return addCheck(this, CODE_NUMBER_LTE, value, (input, param, options) => {
    if (input > param) {
      return issueFactory(input, options);
    }
  });
}

function multipleOf(this: NumberShape, value: number, options?: ConstraintOptions | Message): NumberShape {
  const issueFactory = createIssueFactory(CODE_NUMBER_MULTIPLE_OF, MESSAGE_NUMBER_MULTIPLE_OF, options, value);

  return addCheck(this, CODE_NUMBER_MULTIPLE_OF, value, (input, param, options) => {
    if (input % param !== 0) {
      return issueFactory(input, options);
    }
  });
}

function safe(this: NumberShape, options?: ConstraintOptions | Message): NumberShape {
  return this.min(Number.MIN_SAFE_INTEGER, options).max(Number.MAX_SAFE_INTEGER, options);
}
