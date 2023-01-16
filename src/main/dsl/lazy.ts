import { AnyShape, LazyShape } from '../shapes';

/**
 * Creates the shape that resolves the underlying shape on-demand.
 *
 * @param shapeProvider The provider that returns the base shape.
 */
export function lazy<S extends AnyShape>(shapeProvider: () => S): LazyShape<S> {
  return new LazyShape(shapeProvider);
}
