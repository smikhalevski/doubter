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

import {
  CODE_ARRAY_INCLUDES,
  CODE_ARRAY_MAX,
  CODE_ARRAY_MIN,
  MESSAGE_ARRAY_INCLUDES,
  MESSAGE_ARRAY_MAX,
  MESSAGE_ARRAY_MIN,
} from '../constants';
import { ArrayShape } from '../shape/ArrayShape';
import { AnyShape, Shape } from '../shape/Shape';
import { IssueOptions, Message, ParseOptions, Result } from '../types';
import { createIssue } from '../utils';

declare module '../core' {
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
export default function enableArrayEssentials(ctor: typeof ArrayShape): void {
  ctor.prototype.length = function (length, issueOptions) {
    return this.min(length, issueOptions).max(length, issueOptions);
  };

  ctor.prototype.min = function (length, issueOptions) {
    return this.addOperation(
      (value, param, options) => {
        if (value.length >= param) {
          return null;
        }
        return [createIssue(CODE_ARRAY_MIN, value, MESSAGE_ARRAY_MIN, param, options, issueOptions)];
      },
      { type: CODE_ARRAY_MIN, param: length }
    );
  };

  ctor.prototype.max = function (length, issueOptions) {
    return this.addOperation(
      (value, param, options) => {
        if (value.length <= param) {
          return null;
        }
        return [createIssue(CODE_ARRAY_MAX, value, MESSAGE_ARRAY_MAX, param, options, issueOptions)];
      },
      { type: CODE_ARRAY_MAX, param: length }
    );
  };

  ctor.prototype.nonEmpty = function (issueOptions) {
    return this.min(1, issueOptions);
  };

  ctor.prototype.includes = function (value, issueOptions) {
    if (!(value instanceof Shape)) {
      return this.addOperation(
        (value, param, options) => {
          if (value.includes(param)) {
            return null;
          }
          return [createIssue(CODE_ARRAY_INCLUDES, value, MESSAGE_ARRAY_INCLUDES, param, options, issueOptions)];
        },
        { type: CODE_ARRAY_INCLUDES, param: value }
      );
    }

    if (value.isAsync) {
      const next = (value: unknown[], shape: Shape, options: ParseOptions, index: number): Promise<Result> => {
        if (index === value.length) {
          return Promise.resolve([
            createIssue(CODE_ARRAY_INCLUDES, value, MESSAGE_ARRAY_INCLUDES, shape, options, issueOptions),
          ]);
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
        return [createIssue(CODE_ARRAY_INCLUDES, value, MESSAGE_ARRAY_INCLUDES, param, options, issueOptions)];
      },
      { type: CODE_ARRAY_INCLUDES, param: value }
    );
  };
}
