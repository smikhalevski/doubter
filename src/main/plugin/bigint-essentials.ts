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
import { Any, IssueOptions, Message } from '../types';
import { createIssue, toIssueOptions } from '../utils';

declare module '../core' {
  export interface Messages {
    /**
     * @default "Must be greater than or equal to %s"
     */
    'bigint.min': Message | Any;

    /**
     * @default "Must be less than or equal to %s"
     */
    'bigint.max': Message | Any;
  }

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
  const { messages, prototype } = ctor;

  messages[CODE_BIGINT_MIN] = 'Must be greater than or equal to %s';
  messages[CODE_BIGINT_MAX] = 'Must be less than or equal to %s';

  prototype.positive = function (options) {
    return this.min(1, options);
  };

  prototype.negative = function (options) {
    return this.max(-1, options);
  };

  prototype.nonPositive = function (options) {
    return this.max(0, options);
  };

  prototype.nonNegative = function (options) {
    return this.min(0, options);
  };

  prototype.min = function (value, options) {
    const param = BigInt(value);
    const issueOptions = toIssueOptions(options);

    return this.addOperation(
      (value, param, options) => {
        if (value >= param) {
          return null;
        }
        return [createIssue(CODE_BIGINT_MIN, value, MESSAGE_BIGINT_MIN, param, options, issueOptions)];
      },
      { type: CODE_BIGINT_MIN, param }
    );
  };

  prototype.max = function (value, options) {
    const param = BigInt(value);
    const issueOptions = toIssueOptions(options);

    return this.addOperation(
      (value, param, options) => {
        if (value <= param) {
          return null;
        }
        return [createIssue(CODE_BIGINT_MAX, value, MESSAGE_BIGINT_MAX, param, options, issueOptions)];
      },
      { type: CODE_BIGINT_MAX, param }
    );
  };
}
