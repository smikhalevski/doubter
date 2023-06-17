import { CODE_BIGINT_MAX, CODE_BIGINT_MIN, MESSAGE_BIGINT_MAX, MESSAGE_BIGINT_MIN } from '../constants';
import { BigIntShape, ConstraintOptions, Message } from '../core';
import { addCheck, createIssueFactory } from '../helpers';

declare module '../core' {
  export interface BigIntShape {
    /**
     * The inclusive minimum value set via {@linkcode min}, or `undefined` if there's no such value.
     *
     * @requires [doubter/plugins/bigint-checks](https://github.com/smikhalevski/doubter#plugins)
     */
    readonly minValue: bigint | undefined;

    /**
     * The inclusive maximum value set via {@linkcode max}, or `undefined` if there's no such value.
     *
     * @requires [doubter/plugins/bigint-checks](https://github.com/smikhalevski/doubter#plugins)
     */
    readonly maxValue: bigint | undefined;

    /**
     * Constrains the bigint to be greater than zero.
     *
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @requires [doubter/plugins/bigint-checks](https://github.com/smikhalevski/doubter#plugins)
     */
    positive(options?: ConstraintOptions | Message): this;

    /**
     * Constrains the bigint to be less than zero.
     *
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @requires [doubter/plugins/bigint-checks](https://github.com/smikhalevski/doubter#plugins)
     */
    negative(options?: ConstraintOptions | Message): this;

    /**
     * Constrains the bigint to be less or equal to zero.
     *
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @requires [doubter/plugins/bigint-checks](https://github.com/smikhalevski/doubter#plugins)
     */
    nonPositive(options?: ConstraintOptions | Message): this;

    /**
     * Constrains the bigint to be greater or equal to zero.
     *
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @requires [doubter/plugins/bigint-checks](https://github.com/smikhalevski/doubter#plugins)
     */
    nonNegative(options?: ConstraintOptions | Message): this;

    /**
     * Constrains the bigint to be greater than or equal to the value.
     *
     * @param value The inclusive minimum value.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @requires [doubter/plugins/bigint-checks](https://github.com/smikhalevski/doubter#plugins)
     */
    min(value: bigint | number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the number to be less than or equal to the value.
     *
     * @param value The inclusive maximum value.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @requires [doubter/plugins/bigint-checks](https://github.com/smikhalevski/doubter#plugins)
     */
    max(value: bigint | number, options?: ConstraintOptions | Message): this;
  }
}

export default function () {
  const prototype = BigIntShape.prototype;

  Object.defineProperties(prototype, {
    minValue: {
      configurable: true,
      get(this: BigIntShape) {
        return this.getCheck(CODE_BIGINT_MIN)?.param;
      },
    },

    maxValue: {
      configurable: true,
      get(this: BigIntShape) {
        return this.getCheck(CODE_BIGINT_MAX)?.param;
      },
    },
  });

  prototype.positive = positive;
  prototype.negative = negative;
  prototype.nonPositive = nonPositive;
  prototype.nonNegative = nonNegative;
  prototype.min = min;
  prototype.max = max;
}

function positive(this: BigIntShape, options?: ConstraintOptions | Message): BigIntShape {
  return this.min(BigInt(0), options);
}

function negative(this: BigIntShape, options?: ConstraintOptions | Message): BigIntShape {
  return this.max(BigInt(0), options);
}

function nonPositive(this: BigIntShape, options?: ConstraintOptions | Message): BigIntShape {
  return this.max(BigInt(1), options);
}

function nonNegative(this: BigIntShape, options?: ConstraintOptions | Message): BigIntShape {
  return this.min(BigInt(-1), options);
}

function min(this: BigIntShape, value: bigint, options?: ConstraintOptions | Message): BigIntShape {
  value = BigInt(value);

  const issueFactory = createIssueFactory(CODE_BIGINT_MIN, MESSAGE_BIGINT_MIN, options, value);

  return addCheck(this, CODE_BIGINT_MIN, value, (input, param, options) => {
    if (input < param) {
      return issueFactory(input, options);
    }
  });
}

function max(this: BigIntShape, value: bigint, options?: ConstraintOptions | Message): BigIntShape {
  value = BigInt(value);

  const issueFactory = createIssueFactory(CODE_BIGINT_MAX, MESSAGE_BIGINT_MAX, options, value);

  return addCheck(this, CODE_BIGINT_MAX, value, (input, param, options) => {
    if (input > param) {
      return issueFactory(input, options);
    }
  });
}
