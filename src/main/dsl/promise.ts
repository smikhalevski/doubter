import { AnyShape, PromiseShape, Shape } from '../shape';
import { IssueOptions, Message } from '../types';

/**
 * Creates the `Promise` instance shape.
 *
 * @param options The issue options or the issue message.
 * @template ValueShape The shape of the resolved value.
 * @group DSL
 */
export function promise(options?: IssueOptions | Message): PromiseShape<null>;

/**
 * Creates the `Promise` instance shape that validates the fulfillment value.
 *
 * @param shape The shape of the resolved value.
 * @param options The issue options or the issue message.
 * @template ValueShape The shape of the resolved value.
 * @group DSL
 */
export function promise<ValueShape extends AnyShape>(
  shape: ValueShape,
  options?: IssueOptions | Message
): PromiseShape<ValueShape>;

export function promise(
  shape?: AnyShape | IssueOptions | Message,
  options?: IssueOptions | Message
): PromiseShape<AnyShape | null> {
  if (shape instanceof Shape) {
    return new PromiseShape(shape, options);
  } else {
    return new PromiseShape(null, shape);
  }
}
