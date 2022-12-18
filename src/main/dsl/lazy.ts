import { AnyShape, LazyShape } from '../shapes';

/**
 * Creates the sync lazy-loaded shape.
 *
 * @param shapeProvider The provider that returns the base shape.
 */
export function lazy<S extends AnyShape>(shapeProvider: () => S): LazyShape<S> {
  return new LazyShape(shapeProvider);
}
