/**
 * The plugin that enhances {@link core!SetShape SetShape} with additional methods.
 *
 * ```ts
 * import { SetShape } from 'doubter/core';
 * import enableSetEssentials from 'doubter/plugin/set-essentials';
 *
 * enableSetEssentials(SetShape);
 * ```
 *
 * @module plugin/set-essentials
 */
import { CODE_SET_MAX, CODE_SET_MIN } from '../constants';
import { SetShape } from '../shape/SetShape';
import { AnyShape } from '../shape/Shape';
import { Any, IssueOptions, Message } from '../types';
import { createIssueFactory } from '../utils';

declare module '../core' {
  export interface Messages {
    /**
     * @default "Must have the minimum size of %s"
     */
    'set.min': Message | Any;

    /**
     * @default "Must have the maximum size of %s"
     */
    'set.max': Message | Any;
  }

  export interface SetShape<ValueShape extends AnyShape> {
    /**
     * Constrains the set size.
     *
     * @param size The minimum set size.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/set-essentials! plugin/set-essentials}
     */
    size(size: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the minimum set size.
     *
     * @param size The minimum set size.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/set-essentials! plugin/set-essentials}
     */
    min(size: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the maximum set size.
     *
     * @param size The maximum set size.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/set-essentials! plugin/set-essentials}
     */
    max(size: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the {@link !Set Set} to contain at least one element.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/set-essentials! plugin/set-essentials}
     */
    nonEmpty(options?: IssueOptions | Message): this;
  }
}

/**
 * Enhances {@link core!SetShape SetShape} with additional methods.
 */
export default function enableSetEssentials(ctor: typeof SetShape): void {
  const { messages, prototype } = ctor;

  messages[CODE_SET_MIN] = 'Must have the minimum size of %s';
  messages[CODE_SET_MAX] = 'Must have the maximum size of %s';

  prototype.size = function (size, options) {
    return this.min(size, options).max(size, options);
  };

  prototype.min = function (size, options) {
    const issueFactory = createIssueFactory(CODE_SET_MIN, ctor.messages[CODE_SET_MIN], options, size);

    return this.addOperation(
      (value, param, options) => {
        if (value.size >= param) {
          return null;
        }
        return [issueFactory(value, options)];
      },
      { type: CODE_SET_MIN, param: size }
    );
  };

  prototype.max = function (size, options) {
    const issueFactory = createIssueFactory(CODE_SET_MAX, ctor.messages[CODE_SET_MAX], options, size);

    return this.addOperation(
      (value, param, options) => {
        if (value.size <= param) {
          return null;
        }
        return [issueFactory(value, options)];
      },
      { type: CODE_SET_MAX, param: size }
    );
  };

  prototype.nonEmpty = function (options) {
    return this.min(1, options);
  };
}
