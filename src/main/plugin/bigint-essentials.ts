/**
 * The plugin that enhances {@link core!BigIntShape BigIntShape} with additional methods.
 *
 * ```ts
 * import { BigIntShape } from 'doubter/core';
 * import enableBigIntEssentials from 'doubter/plugin/bigint-essentials';
 *
 * enableBigIntEssentials(BigIntShape);
 * ```
 *
 * @module plugin/bigint-essentials
 */

import { CODE_BIGINT_MAX, CODE_BIGINT_MIN, MESSAGE_BIGINT_MAX, MESSAGE_BIGINT_MIN } from '../constants';
import { BigIntShape } from '../shape/BigIntShape';
import { IssueOptions, Message } from '../types';
import { createIssue } from '../utils';

declare module '../core' {
  export interface BigIntShape {
    /**
     * Constrains the bigint to be greater than zero.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/bigint-essentials! plugin/bigint-essentials}
     */
    positive(options?: IssueOptions | Message): this;

    /**
     * Constrains the bigint to be less than zero.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/bigint-essentials! plugin/bigint-essentials}
     */
    negative(options?: IssueOptions | Message): this;

    /**
     * Constrains the bigint to be less or equal to zero.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/bigint-essentials! plugin/bigint-essentials}
     */
    nonPositive(options?: IssueOptions | Message): this;

    /**
     * Constrains the bigint to be greater or equal to zero.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/bigint-essentials! plugin/bigint-essentials}
     */
    nonNegative(options?: IssueOptions | Message): this;

    /**
     * Constrains the bigint to be greater than or equal to the value.
     *
     * @param value The inclusive minimum value.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/bigint-essentials! plugin/bigint-essentials}
     */
    min(value: bigint | number | string, options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be less than or equal to the value.
     *
     * @param value The inclusive maximum value.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/bigint-essentials! plugin/bigint-essentials}
     */
    max(value: bigint | number | string, options?: IssueOptions | Message): this;
  }
}

/**
 * Enhances {@link core!BigIntShape BigIntShape} with additional methods.
 */
export default function enableBigIntEssentials(ctor: typeof BigIntShape): void {
  ctor.prototype.positive = function (issueOptions) {
    return this.min(1, issueOptions);
  };

  ctor.prototype.negative = function (issueOptions) {
    return this.max(-1, issueOptions);
  };

  ctor.prototype.nonPositive = function (issueOptions) {
    return this.max(0, issueOptions);
  };

  ctor.prototype.nonNegative = function (issueOptions) {
    return this.min(0, issueOptions);
  };

  ctor.prototype.min = function (value, issueOptions) {
    return this.addOperation(
      (value, param, options) => {
        if (value >= param) {
          return null;
        }
        return [createIssue(CODE_BIGINT_MIN, value, MESSAGE_BIGINT_MIN, param, options, issueOptions)];
      },
      { type: CODE_BIGINT_MIN, param: BigInt(value) }
    );
  };

  ctor.prototype.max = function (value, issueOptions) {
    return this.addOperation(
      (value, param, options) => {
        if (value <= param) {
          return null;
        }
        return [createIssue(CODE_BIGINT_MAX, value, MESSAGE_BIGINT_MAX, param, options, issueOptions)];
      },
      { type: CODE_BIGINT_MAX, param: BigInt(value) }
    );
  };
}
