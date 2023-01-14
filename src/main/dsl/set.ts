import { AnyShape, SetShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

/**
 * Creates the `Set` instance shape.
 *
 * @param shape The shape of set values.
 * @param options The constraint options or an issue message.
 * @template S The shape of set values.
 */
export function set<S extends AnyShape>(shape: S, options?: TypeConstraintOptions | Message): SetShape<S> {
  return new SetShape(shape, options);
}
