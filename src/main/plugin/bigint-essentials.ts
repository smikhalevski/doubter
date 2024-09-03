/**
 * The plugin that enhances {@link core!BigIntShape BigIntShape} with additional methods.
 *
 * ```ts
 * import * as d from 'doubter/core';
 * import 'doubter/plugin/bigint-essentials';
 *
 * d.bigint().nonNegative();
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

BigIntShape.prototype.positive = function (issueOptions) {
  return this.min(1, issueOptions);
};

BigIntShape.prototype.negative = function (issueOptions) {
  return this.max(-1, issueOptions);
};

BigIntShape.prototype.nonPositive = function (issueOptions) {
  return this.max(0, issueOptions);
};

BigIntShape.prototype.nonNegative = function (issueOptions) {
  return this.min(0, issueOptions);
};

BigIntShape.prototype.min = function (value, issueOptions) {
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

BigIntShape.prototype.max = function (value, issueOptions) {
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
