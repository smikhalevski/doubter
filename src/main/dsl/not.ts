import { AnyShape, NotShape, Shape } from '../shapes';
import { ConstraintOptions, Message } from '../types';

/**
 * Creates the shape that only allows values that don't conform the shape.
 *
 * @param shape The shape to which the output must not conform.
 * @param options The constraint options or an issue message.
 * @template ExcludedShape The shape to which the output must not conform.
 */
export function not<ExcludedShape extends AnyShape>(
  shape: ExcludedShape,
  options?: ConstraintOptions | Message
): NotShape<Shape, ExcludedShape> {
  return new Shape().not(shape, options);
}
