import { AnyShape, DefaultableShape } from '../shapes';

/**
 * Creates the nullable shape.
 *
 * @param shape The underlying shape.
 * @param defaultValue The value that should be used if input is `undefined`.
 */
export function nullable<S extends AnyShape, O = null>(shape: S, defaultValue?: O): DefaultableShape<S, null, O> {
  return new DefaultableShape(shape, null, defaultValue);
}
