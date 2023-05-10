import { AnyShape, LazyShape } from '../shapes';
import { ConstraintOptions, Message } from '../types';

/**
 * Creates the shape that resolves the underlying shape on-demand.
 *
 * @param shapeProvider The provider that returns the resolved shape.
 * @param options The constraint options or an issue message that are used if a cyclic reference is detected.
 * @template ProvidedShape The provided shape.
 */
export function lazy<ProvidedShape extends AnyShape>(shapeProvider: () => ProvidedShape, options?: ConstraintOptions | Message): LazyShape<ProvidedShape> {
  return new LazyShape(shapeProvider, options);
}
