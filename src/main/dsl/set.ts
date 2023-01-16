import { AnyShape, SetShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

/**
 * Creates the `Set` instance shape.
 *
 * @param shape The value shape
 * @param options The constraint options or an issue message.
 * @template S The value shape.
 */
export function set<S extends AnyShape>(shape: S, options?: TypeConstraintOptions | Message): SetShape<S> {
  return new SetShape(shape, options);
}
