import { AnyShape, NotShape, Shape } from '../shapes';
import { ConstraintOptions, Message } from '../shared-types';

/**
 * Creates the shape that only allows values that don't conform the shape.
 *
 * @param shape The shape to which the output must not conform.
 * @param options The constraint options or an issue message.
 * @template S The shape to which the output must not conform.
 */
export function not<S extends AnyShape>(shape: S, options?: ConstraintOptions | Message): NotShape<Shape, S> {
  return new Shape().not(shape, options);
}
