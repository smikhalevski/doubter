import { CODE_SET_MAX, CODE_SET_MIN, MESSAGE_SET_MAX, MESSAGE_SET_MIN } from '../constants';
import { AnyShape, ConstraintOptions, Message, SetShape } from '../core';
import { addCheck, createIssueFactory } from '../helpers';

declare module '../core' {
  export interface SetShape<ValueShape extends AnyShape> {
    /**
     * The minimum set size, or `undefined` if there's no minimum size.
     *
     * @requires [doubter/plugins/set](https://github.com/smikhalevski/doubter#plugins)
     */
    readonly minSize: number | undefined;

    /**
     * The maximum set size, or `undefined` if there's no maximum size.
     *
     * @requires [doubter/plugins/set](https://github.com/smikhalevski/doubter#plugins)
     */
    readonly maxSize: number | undefined;

    /**
     * Constrains the set size.
     *
     * @param size The minimum set size.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @requires [doubter/plugins/set](https://github.com/smikhalevski/doubter#plugins)
     */
    size(size: number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the minimum set size.
     *
     * @param size The minimum set size.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @requires [doubter/plugins/set](https://github.com/smikhalevski/doubter#plugins)
     */
    min(size: number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the maximum set size.
     *
     * @param size The maximum set size.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @requires [doubter/plugins/set](https://github.com/smikhalevski/doubter#plugins)
     */
    max(size: number, options?: ConstraintOptions | Message): this;
  }
}

export default function () {
  const prototype = SetShape.prototype;

  Object.defineProperties(prototype, {
    minSize: {
      configurable: true,
      get(this: SetShape<any>) {
        return this.getCheck(CODE_SET_MIN)?.param;
      },
    },

    maxSize: {
      configurable: true,
      get(this: SetShape<any>) {
        return this.getCheck(CODE_SET_MAX)?.param;
      },
    },
  });

  prototype.size = size;
  prototype.min = min;
  prototype.max = max;
}

function size(this: SetShape<any>, size: number, options?: ConstraintOptions | Message): SetShape<any> {
  return this.min(size, options).max(size, options);
}

function min(this: SetShape<any>, size: number, options?: ConstraintOptions | Message): SetShape<any> {
  const issueFactory = createIssueFactory(CODE_SET_MIN, MESSAGE_SET_MIN, options, size);

  return addCheck(this, CODE_SET_MIN, size, (input, param, options) => {
    if (input.size < param) {
      return issueFactory(input, options);
    }
  });
}

function max(this: SetShape<any>, size: number, options?: ConstraintOptions | Message): SetShape<any> {
  const issueFactory = createIssueFactory(CODE_SET_MAX, MESSAGE_SET_MAX, options, size);

  return addCheck(this, CODE_SET_MAX, size, (input, param, options) => {
    if (input.size > param) {
      return issueFactory(input, options);
    }
  });
}
