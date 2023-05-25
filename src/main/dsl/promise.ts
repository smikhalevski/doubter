import { AnyShape, PromiseShape } from '../shapes';
import { ConstraintOptions, Message } from '../types';

/**
 * Creates the `Promise` instance shape.
 *
 * @param shape The shape of the resolved value.
 * @param options The constraint options or an issue message.
 * @template ValueShape The shape of the resolved value.
 */
export function promise<ValueShape extends AnyShape>(
  shape: ValueShape,
  options?: ConstraintOptions | Message
): PromiseShape<ValueShape> {
  return new PromiseShape(shape, options);
}
