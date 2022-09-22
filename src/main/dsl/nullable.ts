import { AnyShape, NullableShape } from '../shapes';

/**
 * Creates the nullable shape.
 *
 * @param shape The underlying shape.
 */
export function nullable<S extends AnyShape>(shape: S): NullableShape<S> {
  return new NullableShape(shape);
}
