import { identity } from '../internal/lang.js';
import { LazyShape } from '../shape/LazyShape.js';
import { AnyShape, Input } from '../shape/Shape.js';

/**
 * Creates the shape that resolves the underlying shape on-demand.
 *
 * @param shapeProvider The provider that returns the resolved shape.
 * @template ProvidedShape The provided shape.
 * @group DSL
 */
export function lazy<ProvidedShape extends AnyShape>(
  shapeProvider: () => ProvidedShape
): LazyShape<ProvidedShape, Input<ProvidedShape>> {
  return new LazyShape(shapeProvider, identity);
}
