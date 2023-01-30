import { AnyShape, LazyShape } from '../shapes';

/**
 * Creates the shape that resolves the underlying shape on-demand.
 *
 * @param shapeProvider The provider that returns the resolved shape.
 * @template S The resolved shape.
 */
export function lazy<S extends AnyShape>(shapeProvider: () => S): LazyShape<S> {
  return new LazyShape(shapeProvider);
}
