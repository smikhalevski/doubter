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
import { CODE_SET_MAX, CODE_SET_MIN, MESSAGE_SET_MAX, MESSAGE_SET_MIN } from '../constants';
import { SetShape } from '../shape/SetShape';
import { AnyShape } from '../shape/Shape';
import { IssueOptions, Message } from '../types';
import { createIssue } from '../utils';

declare module '../core' {
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
     * Constrains the {@link !Set} to contain at least one element.
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
  const { prototype } = ctor;

  prototype.size = function (size, issueOptions) {
    return this.min(size, issueOptions).max(size, issueOptions);
  };

  prototype.min = function (size, issueOptions) {
    return this.addOperation(
      (value, param, options) => {
        if (value.size >= param) {
          return null;
        }
        return [createIssue(CODE_SET_MIN, value, MESSAGE_SET_MIN, param, options, issueOptions)];
      },
      { type: CODE_SET_MIN, param: size }
    );
  };

  prototype.max = function (size, issueOptions) {
    return this.addOperation(
      (value, param, options) => {
        if (value.size <= param) {
          return null;
        }
        return [createIssue(CODE_SET_MAX, value, MESSAGE_SET_MAX, param, options, issueOptions)];
      },
      { type: CODE_SET_MAX, param: size }
    );
  };

  prototype.nonEmpty = function (issueOptions) {
    return this.min(1, issueOptions);
  };
}
