/**
 * The plugin that enhances {@link doubter/core!BigIntShape} with additional methods.
 *
 * ```ts
 * import { BigIntShape } from 'doubter/core';
 * import enableBigIntEssentials from 'doubter/plugin/bigint-essentials';
 *
 * enableBigIntEssentials(BigIntShape.prototype);
 * ```
 *
 * @module doubter/plugin/bigint-essentials
 */

import { CODE_BIGINT_MAX, CODE_BIGINT_MIN, MESSAGE_BIGINT_MAX, MESSAGE_BIGINT_MIN } from '../constants';
import { BigIntShape, IssueOptions, Message } from '../core';
import { createIssueFactory } from '../utils';

declare module '../core' {
  export interface BigIntShape {
    /**
     * Constrains the bigint to be greater than zero.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/bigint-essentials!}
     */
    positive(options?: IssueOptions | Message): this;

    /**
     * Constrains the bigint to be less than zero.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/bigint-essentials!}
     */
    negative(options?: IssueOptions | Message): this;

    /**
     * Constrains the bigint to be less or equal to zero.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/bigint-essentials!}
     */
    nonPositive(options?: IssueOptions | Message): this;

    /**
     * Constrains the bigint to be greater or equal to zero.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/bigint-essentials!}
     */
    nonNegative(options?: IssueOptions | Message): this;

    /**
     * Constrains the bigint to be greater than or equal to the value.
     *
     * @param value The inclusive minimum value.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/bigint-essentials!}
     */
    min(value: bigint | number, options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be less than or equal to the value.
     *
     * @param value The inclusive maximum value.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/bigint-essentials!}
     */
    max(value: bigint | number, options?: IssueOptions | Message): this;
  }
}

/**
 * Enhances {@link doubter/core!BigIntShape} with additional methods.
 */
export default function enableBigIntEssentials(prototype: BigIntShape): void {
  prototype.positive = function (options) {
    return this.min(0, options);
  };

  prototype.negative = function (options) {
    return this.max(0, options);
  };

  prototype.nonPositive = function (options) {
    return this.max(1, options);
  };

  prototype.nonNegative = function (options) {
    return this.min(-1, options);
  };

  prototype.min = function (value, options) {
    const param = BigInt(value);
    const issueFactory = createIssueFactory(CODE_BIGINT_MIN, MESSAGE_BIGINT_MIN, options, param);

    return this.use(
      next => (input, output, options, issues) => {
        if (output < param) {
          (issues ||= []).push(issueFactory(output, options));

          if (options.earlyReturn) {
            return issues;
          }
        }
        return next(input, output, options, issues);
      },
      { type: CODE_BIGINT_MIN, param }
    );
  };

  prototype.max = function (value, options) {
    const param = BigInt(value);
    const issueFactory = createIssueFactory(CODE_BIGINT_MAX, MESSAGE_BIGINT_MAX, options, param);

    return this.use(
      next => (input, output, options, issues) => {
        if (output > param) {
          (issues ||= []).push(issueFactory(output, options));

          if (options.earlyReturn) {
            return issues;
          }
        }
        return next(input, output, options, issues);
      },
      { type: CODE_BIGINT_MAX, param }
    );
  };
}
