/**
 * The plugin that enhances {@link core!ArrayShape ArrayShape} with additional methods.
 *
 * ```ts
 * import { ArrayShape } from 'doubter/core';
 * import enableArrayEssentials from 'doubter/plugin/array-essentials';
 *
 * enableArrayEssentials(ArrayShape);
 * ```
 *
 * @module plugin/array-essentials
 */

import { CODE_ARRAY_INCLUDES, CODE_ARRAY_MAX, CODE_ARRAY_MIN } from '../constants';
import { ArrayShape } from '../shape/ArrayShape';
import { AnyShape, Shape } from '../shape/Shape';
import { Any, ApplyOptions, IssueOptions, Message, Result } from '../types';
import { createIssueFactory } from '../utils';

declare module '../core' {
  export interface Messages {
    /**
     * @default "Must include a value"
     */
    'array.includes': Message | Any;

    /**
     * @default "Must have the maximum length of %s"
     */
    'array.max': Message | Any;

    /**
     * @default "Must have the minimum length of %s"
     */
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
     * @param value The shape of the required element or its literal value.
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

    return this.addOperation(
      (value, param, options) => {
        if (value.length >= length) {
          return null;
        }
        return [issueFactory(value, options)];
      },
      { type: CODE_ARRAY_MIN, param: length }
    );
  };

  prototype.max = function (length, options) {
    const issueFactory = createIssueFactory(CODE_ARRAY_MAX, ctor.messages[CODE_ARRAY_MAX], options, length);

    return this.addOperation(
      (value, param, options) => {
        if (value.length <= length) {
          return null;
        }
        return [issueFactory(value, options)];
      },
      { type: CODE_ARRAY_MAX, param: length }
    );
  };

  prototype.nonEmpty = function (options) {
    return this.min(1, options);
  };

  prototype.includes = function (value, options) {
    const issueFactory = createIssueFactory(CODE_ARRAY_INCLUDES, ctor.messages[CODE_ARRAY_INCLUDES], options, value);

    if (!(value instanceof Shape)) {
      return this.addOperation(
        (value, param, options) => {
          if (value.includes(param)) {
            return null;
          }
          return [issueFactory(value, options)];
        },
        { type: CODE_ARRAY_INCLUDES, param: value }
      );
    }

    if (value.isAsync) {
      const next = (value: unknown[], shape: Shape, options: ApplyOptions, index: number): Promise<Result> => {
        if (index === value.length) {
          return Promise.resolve([issueFactory(value, options)]);
        }

        return shape.tryAsync(value[index]).then(result => {
          if (result.ok) {
            return null;
          }
          return next(value, shape, options, index + 1);
        });
      };

      return this.addAsyncOperation((value, param, options) => next(value, param, options, 0), {
        type: CODE_ARRAY_INCLUDES,
        param: value,
      });
    }

    return this.addOperation(
      (value, param, options) => {
        for (const item of value) {
          if (param.try(item, options).ok) {
            return null;
          }
        }
        return [issueFactory(value, options)];
      },
      { type: CODE_ARRAY_INCLUDES, param: value }
    );
  };
}
