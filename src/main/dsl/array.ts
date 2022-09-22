import { AnyShape, ArrayShape } from '../shapes';
import { InputConstraintOptionsOrMessage } from '../shared-types';

/**
 * Creates the array shape.
 *
 * @param shape The shape of an array element.
 * @param options The constraint options or an issue message.
 */
export function array<S extends AnyShape>(shape: S, options?: InputConstraintOptionsOrMessage): ArrayShape<S> {
  return new ArrayShape(shape, options);
}
