import { AnyShape, ArrayShape, ConstraintOptions, createIssueFactory, Message } from 'doubter';
import { CODE_ARRAY_MAX, CODE_ARRAY_MIN, MESSAGE_ARRAY_MAX, MESSAGE_ARRAY_MIN } from '../constants';
import { addCheck } from './utils';

declare module 'doubter' {
  export interface ArrayShape<HeadShapes extends readonly AnyShape[], RestShape extends AnyShape | null> {
    /**
     * Constrains the array length.
     *
     * ⚠️ Requires [doubter/plugins/arrays](https://github.com/smikhalevski/doubter#plugins) plugin.
     *
     * @param length The minimum array length.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     */
    length(length: number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the minimum array length.
     *
     * ⚠️ Requires [doubter/plugins/arrays](https://github.com/smikhalevski/doubter#plugins) plugin.
     *
     * @param length The minimum array length.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     */
    min(length: number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the maximum array length.
     *
     * ⚠️ Requires [doubter/plugins/arrays](https://github.com/smikhalevski/doubter#plugins) plugin.
     *
     * @param length The maximum array length.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     */
    max(length: number, options?: ConstraintOptions | Message): this;
  }
}

export default function () {
  ArrayShape.prototype.length = length;
  ArrayShape.prototype.min = min;
  ArrayShape.prototype.max = max;
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

  return addCheck(this, CODE_ARRAY_MIN, length, (input, param, options) => {
    if (input.length < param) {
      return issueFactory(input, options);
    }
  });
}

function max(this: ArrayShape<any, any>, length: number, options?: ConstraintOptions | Message): ArrayShape<any, any> {
  const issueFactory = createIssueFactory(CODE_ARRAY_MAX, MESSAGE_ARRAY_MAX, options, length);

  return addCheck(this, CODE_ARRAY_MAX, length, (input, param, options) => {
    if (input.length > param) {
      return issueFactory(input, options);
    }
  });
}
