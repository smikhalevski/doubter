import { AnyShape, ConstraintOptions, createIssueFactory, Message, SetShape } from 'doubter';
import { CODE_SET_MAX, CODE_SET_MIN, MESSAGE_SET_MAX, MESSAGE_SET_MIN } from '../constants';
import { addCheck } from './utils';

declare module 'doubter' {
  export interface SetShape<ValueShape extends AnyShape> {
    /**
     * Constrains the set size.
     *
     * @param size The minimum set size.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     */
    size(this: SetShape<any>, size: number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the minimum set size.
     *
     * @param size The minimum set size.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     */
    min(this: SetShape<any>, size: number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the maximum set size.
     *
     * @param size The maximum set size.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     */
    max(this: SetShape<any>, size: number, options?: ConstraintOptions | Message): this;
  }
}

export default function () {
  SetShape.prototype.size = size;
  SetShape.prototype.min = min;
  SetShape.prototype.max = max;
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
