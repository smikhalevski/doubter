import { ConstraintOptions, createIssueFactory, Message, NumberShape } from 'doubter';
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
import { addCheck } from './utils';

declare module 'doubter' {
  export interface NumberShape {
    /**
     * Constrains the number to be greater than zero.
     *
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     */
    positive(options?: ConstraintOptions | Message): this;

    /**
     * Constrains the number to be less than zero.
     *
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     */
    negative(options?: ConstraintOptions | Message): this;

    /**
     * Constrains the number to be less or equal to zero.
     *
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     */
    nonPositive(options?: ConstraintOptions | Message): this;

    /**
     * Constrains the number to be greater or equal to zero.
     *
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     */
    nonNegative(options?: ConstraintOptions | Message): this;

    /**
     * Constrains the number to be greater than the value.
     *
     * @param value The exclusive minimum value.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     */
    gt(value: number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the number to be less than the value.
     *
     * @param value The exclusive maximum value.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     */
    lt(value: number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the number to be greater than or equal to the value.
     *
     * @param value The inclusive minimum value.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     */
    gte(value: number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the number to be less than or equal to the value.
     *
     * @param value The inclusive maximum value.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     */
    lte(value: number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the number to be greater than or equal to the value.
     *
     * Alias for {@linkcode gte}.
     *
     * @param value The inclusive minimum value.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     */
    min(value: number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the number to be less than or equal to the value.
     *
     * Alias for {@linkcode lte}.
     *
     * @param value The inclusive maximum value.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
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
     */
    multipleOf(value: number, options?: ConstraintOptions | Message): this;
  }
}

export default function () {
  NumberShape.prototype.positive = positive;
  NumberShape.prototype.negative = negative;
  NumberShape.prototype.nonPositive = nonPositive;
  NumberShape.prototype.nonNegative = nonNegative;
  NumberShape.prototype.gt = gt;
  NumberShape.prototype.lt = lt;
  NumberShape.prototype.gte = gte;
  NumberShape.prototype.lte = lte;
  NumberShape.prototype.min = gte;
  NumberShape.prototype.max = lte;
  NumberShape.prototype.multipleOf = multipleOf;
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
