import { identity } from '../internal/lang.ts';
import { LazyShape } from '../shape/LazyShape.ts';
import { AnyShape, Input } from '../shape/Shape.ts';

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
