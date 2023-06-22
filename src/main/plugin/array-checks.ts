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
import { AnyShape, ArrayShape, ConstraintOptions, Message } from '../core';
import { createIssueFactory } from '../utils';

declare module '../core' {
  interface ArrayShape<HeadShapes extends readonly AnyShape[], RestShape extends AnyShape | null> {
    /**
     * The minimum array length, or `undefined` if there's no minimum length.
     *
     * @group Plugin Properties
     * @plugin {@link doubter/plugin/array-checks!}
     */
    readonly minLength: number | undefined;

    /**
     * The maximum array length, or `undefined` if there's no maximum length.
     *
     * @group Plugin Properties
     * @plugin {@link doubter/plugin/array-checks!}
     */
    readonly maxLength: number | undefined;

    /**
     * Constrains the array length.
     *
     * @param length The minimum array length.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/array-checks!}
     */
    length(length: number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the minimum array length.
     *
     * @param length The minimum array length.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/array-checks!}
     */
    min(length: number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the maximum array length.
     *
     * @param length The maximum array length.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/array-checks!}
     */
    max(length: number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the array length to be at least one element.
     *
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/array-checks!}
     */
    nonEmpty(options?: ConstraintOptions | Message): this;

    /**
     * Requires an array to contain at least one element that conforms the given shape.
     *
     * @param shape The shape of the required element.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/array-checks!}
     */
    includes(shape: AnyShape, options?: ConstraintOptions | Message): this;
  }
}

/**
 * Enhances {@linkcode doubter/core!ArrayShape} with additional checks.
 */
export default function () {
  const prototype = ArrayShape.prototype;

  Object.defineProperties(prototype, {
    minLength: {
      configurable: true,
      get(this: ArrayShape<any, any>) {
        return this.getOperationsByKey(CODE_ARRAY_MIN)?.param;
      },
    },

    maxLength: {
      configurable: true,
      get(this: ArrayShape<any, any>) {
        return this.getOperationsByKey(CODE_ARRAY_MAX)?.param;
      },
    },
  });

  prototype.length = length;
  prototype.min = min;
  prototype.max = max;
  prototype.nonEmpty = nonEmpty;
  prototype.includes = includes;
}

function length(
  this: ArrayShape<any, any>,
  length: number,
  options?: ConstraintOptions | Message
): ArrayShape<any, any> {
  return this.min(length, options).max(length, options);
}

function min(this: ArrayShape<any, any>, length: number, options?: ConstraintOptions | Message): ArrayShape<any, any> {
  const issueFactory = createIssueFactory(CODE_ARRAY_MIN, MESSAGE_ARRAY_MIN, options, length);

  return this.check(
    (input, param, options) => {
      if (input.length < param) {
        return issueFactory(input, options);
      }
    },
    { key: CODE_ARRAY_MIN, param: length, force: true }
  );
}

function max(this: ArrayShape<any, any>, length: number, options?: ConstraintOptions | Message): ArrayShape<any, any> {
  const issueFactory = createIssueFactory(CODE_ARRAY_MAX, MESSAGE_ARRAY_MAX, options, length);

  return this.check(
    (input, param, options) => {
      if (input.length > param) {
        return issueFactory(input, options);
      }
    },
    { key: CODE_ARRAY_MAX, param: length, force: true }
  );
}

function nonEmpty(this: ArrayShape<any, any>, options?: ConstraintOptions | Message): ArrayShape<any, any> {
  return this.min(1, options);
}

function includes(
  this: ArrayShape<any, any>,
  shape: AnyShape,
  options?: ConstraintOptions | Message
): ArrayShape<any, any> {
  const issueFactory = createIssueFactory(CODE_ARRAY_INCLUDES, MESSAGE_ARRAY_INCLUDES, options, undefined);

  return this.check(
    (input, param, options) => {
      for (const value of input) {
        if (shape.try(value, options).ok) {
          return;
        }
      }
      return issueFactory(input, options);
    },
    { key: CODE_ARRAY_INCLUDES, param: length, force: true }
  );
}
