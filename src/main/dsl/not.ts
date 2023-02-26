import { AnyShape, Shape } from '../shapes';
import { ConstraintOptions, Message } from '../shared-types';
import { NotShape } from '../shapes/Shape';

/**
 * Creates the shape that only allows values that don't conform the shape.
 *
 * @param options The constraint options or an issue message.
 */
export function not<S extends AnyShape>(shape: S, options?: ConstraintOptions | Message): NotShape<Shape, S> {
  return new Shape().not(shape, options);
}
