/**
 * The plugin that enhances {@link core!ArrayShape ArrayShape} with additional methods.
 *
 * ```ts
 * import { ArrayShape } from 'doubter/core';
 * import enableArrayEssentials from 'doubter/plugin/array-essentials';
 *
 * enableArrayEssentials(ArrayShape.prototype);
 * ```
 *
 * @module plugin/array-essentials
 */

import { CODE_ARRAY_INCLUDES, CODE_ARRAY_MAX, CODE_ARRAY_MIN, ERR_SYNC_REQUIRED } from '../constants';
import { AnyShape, ApplyOptions, ArrayShape, IssueOptions, Message, Shape } from '../core';
import { Any } from '../typings';
import { createIssueFactory } from '../utils';

declare module '../core' {
  export interface Messages {
    'array.includes': Message | Any;
    'array.max': Message | Any;
    'array.min': Message | Any;
  }

  export interface ArrayShape<HeadShapes extends readonly AnyShape[], RestShape extends AnyShape | null> {
    /**
     * Constrains the array length.
     *
     * @param length The minimum array length.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/array-essentials! plugin/array-essentials}
     */
    length(length: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the minimum array length.
     *
     * @param length The minimum array length.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/array-essentials! plugin/array-essentials}
     */
    min(length: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the maximum array length.
     *
     * @param length The maximum array length.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/array-essentials! plugin/array-essentials}
     */
    max(length: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the array length to be at least one element.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/array-essentials! plugin/array-essentials}
     */
    nonEmpty(options?: IssueOptions | Message): this;

    /**
     * Requires an array to contain at least one element that conforms the given shape.
     *
     * @param value The shape of the required element or its literal value. If a shape is provided, then it _must_
     * support {@link Shape#isAsync the synchronous parsing}.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/array-essentials! plugin/array-essentials}
     */
    includes(value: AnyShape | any, options?: IssueOptions | Message): this;
  }
}

/**
 * Enhances {@link core!ArrayShape ArrayShape} with additional methods.
 */
export default function enableArrayEssentials(ctor: typeof ArrayShape<any, any>): void {
  const { messages, prototype } = ctor;

  messages[CODE_ARRAY_INCLUDES] = 'Must include a value';
  messages[CODE_ARRAY_MAX] = 'Must have the maximum length of %s';
  messages[CODE_ARRAY_MIN] = 'Must have the minimum length of %s';

  prototype.length = function (length, options) {
    return this.min(length, options).max(length, options);
  };

  prototype.min = function (length, options) {
    const issueFactory = createIssueFactory(CODE_ARRAY_MIN, ctor.messages[CODE_ARRAY_MIN], options, length);

    return this.use(
      next => (input, output, options, issues) => {
        if (output.length < length) {
          (issues ||= []).push(issueFactory(output, options));

          if (options.earlyReturn) {
            return issues;
          }
        }
        return next(input, output, options, issues);
      },
      { type: CODE_ARRAY_MIN, param: length }
    );
  };

  prototype.max = function (length, options) {
    const issueFactory = createIssueFactory(CODE_ARRAY_MAX, ctor.messages[CODE_ARRAY_MAX], options, length);

    return this.use(
      next => (input, output, options, issues) => {
        if (output.length > length) {
          (issues ||= []).push(issueFactory(output, options));

          if (options.earlyReturn) {
            return issues;
          }
        }
        return next(input, output, options, issues);
      },

      { type: CODE_ARRAY_MAX, param: length }
    );
  };

  prototype.nonEmpty = function (options) {
    return this.min(1, options);
  };

  prototype.includes = function (value, options) {
    const issueFactory = createIssueFactory(CODE_ARRAY_INCLUDES, ctor.messages[CODE_ARRAY_INCLUDES], options, value);

    let lookup: (output: unknown[], options: ApplyOptions) => boolean;

    if (value instanceof Shape) {
      if (value.isAsync) {
        throw new Error(ERR_SYNC_REQUIRED);
      }

      lookup = (output, options) => {
        for (const outputValue of output) {
          if (value.try(outputValue, options).ok) {
            return true;
          }
        }
        return false;
      };
    } else {
      lookup = (output, options) => output.includes(value);
    }

    return this.use(
      next => (input, output, options, issues) => {
        if (!lookup(output, options)) {
          (issues ||= []).push(issueFactory(output, options));

          if (options.earlyReturn) {
            return issues;
          }
        }
        return next(input, output, options, issues);
      },
      { type: CODE_ARRAY_INCLUDES, param: value }
    );
  };
}
