/**
 * The plugin that enhances {@linkcode doubter/core!SetShape} with additional checks.
 *
 * ```ts
 * import setChecks from 'doubter/plugin/set-checks';
 *
 * setChecks();
 * ```
 *
 * @module doubter/plugin/set-checks
 */
import { CODE_SET_MAX, CODE_SET_MIN, MESSAGE_SET_MAX, MESSAGE_SET_MIN } from '../constants';
import { AnyShape, ConstraintOptions, Message, SetShape } from '../core';
import { createIssueFactory } from '../utils';

declare module '../core' {
  export interface SetShape<ValueShape extends AnyShape> {
    /**
     * The minimum set size, or `undefined` if there's no minimum size.
     *
     * @group Plugin Properties
     * @plugin {@link doubter/plugin/set-checks!}
     */
    readonly minSize: number | undefined;

    /**
     * The maximum set size, or `undefined` if there's no maximum size.
     *
     * @group Plugin Properties
     * @plugin {@link doubter/plugin/set-checks!}
     */
    readonly maxSize: number | undefined;

    /**
     * Constrains the set size.
     *
     * @param size The minimum set size.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/set-checks!}
     */
    size(size: number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the minimum set size.
     *
     * @param size The minimum set size.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/set-checks!}
     */
    min(size: number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the maximum set size.
     *
     * @param size The maximum set size.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/set-checks!}
     */
    max(size: number, options?: ConstraintOptions | Message): this;
  }
}

/**
 * Enhances {@linkcode doubter/core!SetShape} with additional checks.
 */
export default function () {
  const prototype = SetShape.prototype;

  // Object.defineProperties(prototype, {
  //   minSize: {
  //     configurable: true,
  //     get(this: SetShape<any>) {
  //       return this.getOperationsByKey(CODE_SET_MIN)?.param;
  //     },
  //   },
  //
  //   maxSize: {
  //     configurable: true,
  //     get(this: SetShape<any>) {
  //       return this.getOperationsByKey(CODE_SET_MAX)?.param;
  //     },
  //   },
  // });

  prototype.size = size;
  prototype.min = min;
  prototype.max = max;
}

function size(this: SetShape<any>, size: number, options?: ConstraintOptions | Message): SetShape<any> {
  return this.min(size, options).max(size, options);
}

function min(this: SetShape<any>, size: number, options?: ConstraintOptions | Message): SetShape<any> {
  const issueFactory = createIssueFactory(CODE_SET_MIN, MESSAGE_SET_MIN, options, size);

  return this.check(
    (input, param, options) => {
      if (input.size < param) {
        return issueFactory(input, options);
      }
    },
    { key: CODE_SET_MIN, payload: size, force: true }
  );
}

function max(this: SetShape<any>, size: number, options?: ConstraintOptions | Message): SetShape<any> {
  const issueFactory = createIssueFactory(CODE_SET_MAX, MESSAGE_SET_MAX, options, size);

  return this.check(
    (input, param, options) => {
      if (input.size > param) {
        return issueFactory(input, options);
      }
    },
    { key: CODE_SET_MAX, payload: size, force: true }
  );
}
