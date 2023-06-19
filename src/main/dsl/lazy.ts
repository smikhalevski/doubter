import { identity } from '../internal';
import { AnyShape, LazyShape } from '../shape';
import { INPUT } from '../shape/Shape';

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
