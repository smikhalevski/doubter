import { AnyShape, SetShape } from '../shapes';
import { ConstraintOptions, Message } from '../types';

/**
 * Creates the `Set` instance shape.
 *
 * @param shape The value shape
 * @param options The constraint options or an issue message.
 * @template ValueShape The value shape.
 */
export function set<ValueShape extends AnyShape>(
  shape: ValueShape,
  options?: ConstraintOptions | Message
): SetShape<ValueShape> {
  return new SetShape(shape, options);
}
