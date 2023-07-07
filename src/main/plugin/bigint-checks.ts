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
     * @plugin {@link doubter/plugin/bigint-checks!}
     */
    positive(options?: IssueOptions | Message): this;

    /**
     * Constrains the bigint to be less than zero.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/bigint-checks!}
     */
    negative(options?: IssueOptions | Message): this;

    /**
     * Constrains the bigint to be less or equal to zero.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/bigint-checks!}
     */
    nonPositive(options?: IssueOptions | Message): this;

    /**
     * Constrains the bigint to be greater or equal to zero.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/bigint-checks!}
     */
    nonNegative(options?: IssueOptions | Message): this;

    /**
     * Constrains the bigint to be greater than or equal to the value.
     *
     * @param value The inclusive minimum value.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/bigint-checks!}
     */
    min(value: bigint | number, options?: IssueOptions | Message): this;

    /**
     * Constrains the number to be less than or equal to the value.
     *
     * @param value The inclusive maximum value.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/bigint-checks!}
     */
    max(value: bigint | number, options?: IssueOptions | Message): this;
  }
}

/**
 * Enhances {@linkcode doubter/core!BigIntShape} with additional checks.
 */
export default function () {
  BigIntShape.prototype.positive = positiveCheck;
  BigIntShape.prototype.negative = negativeCheck;
  BigIntShape.prototype.nonPositive = nonPositiveCheck;
  BigIntShape.prototype.nonNegative = nonNegativeCheck;
  BigIntShape.prototype.min = minCheck;
  BigIntShape.prototype.max = maxCheck;
}

function positiveCheck(this: BigIntShape, options?: IssueOptions | Message): BigIntShape {
  return this.min(BigInt(0), options);
}

function negativeCheck(this: BigIntShape, options?: IssueOptions | Message): BigIntShape {
  return this.max(BigInt(0), options);
}

function nonPositiveCheck(this: BigIntShape, options?: IssueOptions | Message): BigIntShape {
  return this.max(BigInt(1), options);
}

function nonNegativeCheck(this: BigIntShape, options?: IssueOptions | Message): BigIntShape {
  return this.min(BigInt(-1), options);
}

function minCheck(this: BigIntShape, value: bigint, options?: IssueOptions | Message): BigIntShape {
  value = BigInt(value);

  const issueFactory = createIssueFactory(CODE_BIGINT_MIN, MESSAGE_BIGINT_MIN, options, value);

  return this.use(
    next => (input, output, options, issues) => {
      if (output < value) {
        issues = pushIssue(issues, issueFactory(output, options));

        if (!options.verbose) {
          return issues;
        }
      }
      return next(input, output, options, issues);
    },
    { type: CODE_BIGINT_MIN, param: value }
  );
}

function maxCheck(this: BigIntShape, value: bigint, options?: IssueOptions | Message): BigIntShape {
  value = BigInt(value);

  const issueFactory = createIssueFactory(CODE_BIGINT_MAX, MESSAGE_BIGINT_MAX, options, value);

  return this.use(
    next => (input, output, options, issues) => {
      if (output > value) {
        issues = pushIssue(issues, issueFactory(output, options));

        if (!options.verbose) {
          return issues;
        }
      }
      return next(input, output, options, issues);
    },
    { type: CODE_BIGINT_MAX, param: value }
  );
}
