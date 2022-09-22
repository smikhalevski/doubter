import { AnyShape, ArrayShape } from '../shapes';
import { InputConstraintOptions } from '../shared-types';

/**
 * Creates the array shape.
 *
 * @param shape The shape of an array element.
 * @param options The constraint options.
 */
export function array<S extends AnyShape>(shape: S, options?: InputConstraintOptions): ArrayShape<S> {
  return new ArrayShape(shape, options);
}
