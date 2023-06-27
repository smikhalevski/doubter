/**
 * The plugin that enhances {@linkcode doubter/core!BigIntShape} with additional checks.
 *
 * ```ts
 * import bigintChecks from 'doubter/plugin/bigint-checks';
 *
 * bigintChecks();
 * ```
 *
 * @module doubter/plugin/bigint-checks
 */

import { CODE_BIGINT_MAX, CODE_BIGINT_MIN, MESSAGE_BIGINT_MAX, MESSAGE_BIGINT_MIN } from '../constants';
import { BigIntShape, ConstraintOptions, Message } from '../core';
import { pushIssue } from '../internal';
import { createIssueFactory } from '../utils';

declare module '../core' {
  export interface BigIntShape {
    /**
     * The inclusive minimum value set via {@linkcode min}, or `undefined` if there's no such value.
     *
     * @group Plugin Properties
     * @plugin {@link doubter/plugin/bigint-checks!}
     */
    readonly minValue: bigint | undefined;

    /**
     * The inclusive maximum value set via {@linkcode max}, or `undefined` if there's no such value.
     *
     * @group Plugin Properties
     * @plugin {@link doubter/plugin/bigint-checks!}
     */
    readonly maxValue: bigint | undefined;

    /**
     * Constrains the bigint to be greater than zero.
     *
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/bigint-checks!}
     */
    positive(options?: ConstraintOptions | Message): this;

    /**
     * Constrains the bigint to be less than zero.
     *
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/bigint-checks!}
     */
    negative(options?: ConstraintOptions | Message): this;

    /**
     * Constrains the bigint to be less or equal to zero.
     *
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/bigint-checks!}
     */
    nonPositive(options?: ConstraintOptions | Message): this;

    /**
     * Constrains the bigint to be greater or equal to zero.
     *
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/bigint-checks!}
     */
    nonNegative(options?: ConstraintOptions | Message): this;

    /**
     * Constrains the bigint to be greater than or equal to the value.
     *
     * @param value The inclusive minimum value.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/bigint-checks!}
     */
    min(value: bigint | number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the number to be less than or equal to the value.
     *
     * @param value The inclusive maximum value.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/bigint-checks!}
     */
    max(value: bigint | number, options?: ConstraintOptions | Message): this;
  }
}

/**
 * Enhances {@linkcode doubter/core!BigIntShape} with additional checks.
 */
export default function () {
  const prototype = BigIntShape.prototype;

  Object.defineProperties(prototype, {
    minValue: {
      configurable: true,
      get(this: BigIntShape) {
        return this._getOperation(CODE_BIGINT_MIN)?.param;
      },
    },

    maxValue: {
      configurable: true,
      get(this: BigIntShape) {
        return this._getOperation(CODE_BIGINT_MAX)?.param;
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

  return this._addOperation({
    type: CODE_BIGINT_MIN,
    param: value,
    compose: next => (input, output, options, issues) => {
      if (input < value) {
        issues = pushIssue(issues, issueFactory(input, options));

        if (!options.verbose) {
          return issues;
        }
      }
      return next(input, output, options, issues);
    },
  });
}

function max(this: BigIntShape, value: bigint, options?: ConstraintOptions | Message): BigIntShape {
  value = BigInt(value);

  const issueFactory = createIssueFactory(CODE_BIGINT_MAX, MESSAGE_BIGINT_MAX, options, value);

  return this._addOperation({
    type: CODE_BIGINT_MAX,
    param: value,
    compose: next => (input, output, options, issues) => {
      if (input > value) {
        issues = pushIssue(issues, issueFactory(input, options));

        if (!options.verbose) {
          return issues;
        }
      }
      return next(input, output, options, issues);
    },
  });
}
