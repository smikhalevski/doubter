import { AnyShape, ArrayShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

/**
 * Creates the array shape.
 *
 * @param shape The shape of an array element.
 * @param options The constraint options or an issue message.
 */
export function array<S extends AnyShape>(shape: S, options?: TypeConstraintOptions | Message): ArrayShape<S> {
  return new ArrayShape(shape, options);
}
