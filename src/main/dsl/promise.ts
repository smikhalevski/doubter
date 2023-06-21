import { AnyShape, PromiseShape, Shape } from '../shape';
import { ConstraintOptions, Message } from '../types';

/**
 * Creates the `Promise` instance shape.
 *
 * @param options The constraint options or an issue message.
 * @template ValueShape The shape of the resolved value.
 * @group DSL
 */
export function promise(options?: ConstraintOptions | Message): PromiseShape<null>;

/**
 * Creates the `Promise` instance shape that validates the fulfillment value.
 *
 * @param shape The shape of the resolved value.
 * @param options The constraint options or an issue message.
 * @template ValueShape The shape of the resolved value.
 * @group DSL
 */
export function promise<ValueShape extends AnyShape>(
  shape: ValueShape,
  options?: ConstraintOptions | Message
): PromiseShape<ValueShape>;

export function promise(
  shape?: AnyShape | ConstraintOptions | Message,
  options?: ConstraintOptions | Message
): PromiseShape<AnyShape | null> {
  if (shape instanceof Shape) {
    return new PromiseShape(shape, options);
  } else {
    return new PromiseShape(null, shape);
  }
}
