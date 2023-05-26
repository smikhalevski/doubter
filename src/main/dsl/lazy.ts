import { AnyShape, LazyShape } from '../shapes';
import { INPUT } from '../shapes/Shape';
import { identity } from '../utils';

/**
 * Creates the shape that resolves the underlying shape on-demand.
 *
 * @param shapeProvider The provider that returns the resolved shape.
 * @template ProvidedShape The provided shape.
 */
export function lazy<ProvidedShape extends AnyShape>(
  shapeProvider: () => ProvidedShape
): LazyShape<ProvidedShape, ProvidedShape[INPUT]> {
  return new LazyShape(shapeProvider, identity);
}
