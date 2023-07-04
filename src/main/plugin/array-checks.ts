/**
 * The plugin that enhances {@linkcode doubter/core!ArrayShape} with additional checks.
 *
 * ```ts
 * import arrayChecks from 'doubter/plugin/array-checks';
 *
 * arrayChecks();
 * ```
 *
 * @module doubter/plugin/array-checks
 */

import {
  CODE_ARRAY_INCLUDES,
  CODE_ARRAY_MAX,
  CODE_ARRAY_MIN,
  MESSAGE_ARRAY_INCLUDES,
  MESSAGE_ARRAY_MAX,
  MESSAGE_ARRAY_MIN,
} from '../constants';
import { AnyShape, ArrayShape, IssueOptions, Message } from '../core';
import { pushIssue } from '../internal';
import { createIssueFactory } from '../utils';

declare module '../core' {
  interface ArrayShape<HeadShapes extends readonly AnyShape[], RestShape extends AnyShape | null> {
    /**
     * Constrains the array length.
     *
     * @param length The minimum array length.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/array-checks!}
     */
    length(length: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the minimum array length.
     *
     * @param length The minimum array length.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/array-checks!}
     */
    min(length: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the maximum array length.
     *
     * @param length The maximum array length.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/array-checks!}
     */
    max(length: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the array length to be at least one element.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/array-checks!}
     */
    nonEmpty(options?: IssueOptions | Message): this;

    /**
     * Requires an array to contain at least one element that conforms the given shape.
     *
     * @param shape The shape of the required element.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/array-checks!}
     */
    includes(shape: AnyShape, options?: IssueOptions | Message): this;
  }
}

/**
 * Enhances {@linkcode doubter/core!ArrayShape} with additional checks.
 */
export default function () {
  ArrayShape.prototype.length = appendLengthCheck;
  ArrayShape.prototype.min = appendMinCheck;
  ArrayShape.prototype.max = appendMaxCheck;
  ArrayShape.prototype.nonEmpty = appendNonEmptyCheck;
  ArrayShape.prototype.includes = appendIncludesCheck;
}

function appendLengthCheck(
  this: ArrayShape<any, any>,
  length: number,
  options?: IssueOptions | Message
): ArrayShape<any, any> {
  return this.min(length, options).max(length, options);
}

function appendMinCheck(
  this: ArrayShape<any, any>,
  length: number,
  options?: IssueOptions | Message
): ArrayShape<any, any> {
  const issueFactory = createIssueFactory(CODE_ARRAY_MIN, MESSAGE_ARRAY_MIN, options, length);

  return this._addOperation({
    type: CODE_ARRAY_MIN,
    param: length,
    compose: next => (input, output, options, issues) => {
      if (output.length < length) {
        issues = pushIssue(issues, issueFactory(output, options));

        if (!options.verbose) {
          return issues;
        }
      }
      return next(input, output, options, issues);
    },
  });
}

function appendMaxCheck(
  this: ArrayShape<any, any>,
  length: number,
  options?: IssueOptions | Message
): ArrayShape<any, any> {
  const issueFactory = createIssueFactory(CODE_ARRAY_MAX, MESSAGE_ARRAY_MAX, options, length);

  return this._addOperation({
    type: CODE_ARRAY_MAX,
    param: length,
    compose: next => (input, output, options, issues) => {
      if (output.length > length) {
        issues = pushIssue(issues, issueFactory(output, options));

        if (!options.verbose) {
          return issues;
        }
      }
      return next(input, output, options, issues);
    },
  });
}

function appendNonEmptyCheck(this: ArrayShape<any, any>, options?: IssueOptions | Message): ArrayShape<any, any> {
  return this.min(1, options);
}

function appendIncludesCheck(
  this: ArrayShape<any, any>,
  shape: AnyShape,
  options?: IssueOptions | Message
): ArrayShape<any, any> {
  const issueFactory = createIssueFactory(CODE_ARRAY_INCLUDES, MESSAGE_ARRAY_INCLUDES, options, undefined);

  return this._addOperation({
    type: CODE_ARRAY_INCLUDES,
    param: shape,
    compose: next => (input, output, options, issues) => {
      for (const value of output) {
        if (shape.try(value, options).ok) {
          return next(input, output, options, issues);
        }
      }

      issues = pushIssue(issues, issueFactory(output, options));

      if (!options.verbose) {
        return issues;
      }

      return next(input, output, options, issues);
    },
  });
}
