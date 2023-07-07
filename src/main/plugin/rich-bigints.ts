/**
 * The plugin that enhances {@linkcode doubter/core!BigIntShape} with additional methods.
 *
 * ```ts
 * import pluginRichBigInts from 'doubter/plugin/rich-bigints';
 *
 * pluginRichBigInts();
 * ```
 *
 * @module doubter/plugin/rich-bigints
 */

import { CODE_BIGINT_MAX, CODE_BIGINT_MIN, MESSAGE_BIGINT_MAX, MESSAGE_BIGINT_MIN } from '../constants';
import { BigIntShape, IssueOptions, Message } from '../core';
import { pushIssue } from '../internal';
import { createIssueFactory } from '../utils';

declare module '../core' {
  export interface BigIntShape {
    /**
     * Constrains the bigint to be greater than zero.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-bigints!}
     */
    positive(options?: IssueOptions | Message): this;

    /**
     * Constrains the bigint to be less than zero.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-bigints!}
     */
    negative(options?: IssueOptions | Message): this;

    /**
     * Constrains the bigint to be less or equal to zero.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-bigints!}
     */
    nonPositive(options?: IssueOptions | Message): this;

    /**
     * Constrains the bigint to be greater or equal to zero.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-bigints!}
     */
    nonNegative(options?: IssueOptions | Message): this;

    /**
     * Constrains the bigint to be greater than or equal to the value.
     *
     * @param value The inclusive minimum value.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-bigints!}
     */
    min(value: bigint | number, options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be less than or equal to the value.
     *
     * @param value The inclusive maximum value.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-bigints!}
     */
    max(value: bigint | number, options?: IssueOptions | Message): this;
  }
}

/**
 * Enhances {@linkcode doubter/core!BigIntShape} with additional methods.
 */
export default function () {
  BigIntShape.prototype.positive = usePositive;
  BigIntShape.prototype.negative = useNegative;
  BigIntShape.prototype.nonPositive = useNonPositive;
  BigIntShape.prototype.nonNegative = useNonNegative;
  BigIntShape.prototype.min = useMin;
  BigIntShape.prototype.max = useMax;
}

function usePositive(this: BigIntShape, options?: IssueOptions | Message): BigIntShape {
  return this.min(BigInt(0), options);
}

function useNegative(this: BigIntShape, options?: IssueOptions | Message): BigIntShape {
  return this.max(BigInt(0), options);
}

function useNonPositive(this: BigIntShape, options?: IssueOptions | Message): BigIntShape {
  return this.max(BigInt(1), options);
}

function useNonNegative(this: BigIntShape, options?: IssueOptions | Message): BigIntShape {
  return this.min(BigInt(-1), options);
}

function useMin(this: BigIntShape, value: bigint, options?: IssueOptions | Message): BigIntShape {
  const param = BigInt(value);
  const issueFactory = createIssueFactory(CODE_BIGINT_MIN, MESSAGE_BIGINT_MIN, options, param);

  return this.use(
    next => (input, output, options, issues) => {
      if (output < param) {
        issues = pushIssue(issues, issueFactory(output, options));

        if (options.earlyReturn) {
          return issues;
        }
      }
      return next(input, output, options, issues);
    },
    { type: CODE_BIGINT_MIN, param }
  );
}

function useMax(this: BigIntShape, value: bigint, options?: IssueOptions | Message): BigIntShape {
  const param = BigInt(value);
  const issueFactory = createIssueFactory(CODE_BIGINT_MAX, MESSAGE_BIGINT_MAX, options, param);

  return this.use(
    next => (input, output, options, issues) => {
      if (output > param) {
        issues = pushIssue(issues, issueFactory(output, options));

        if (options.earlyReturn) {
          return issues;
        }
      }
      return next(input, output, options, issues);
    },
    { type: CODE_BIGINT_MAX, param }
  );
}
