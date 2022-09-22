import { InputConstraintOptions, ObjectLike } from '../shared-types';
import { AnyShape, ObjectShape } from '../shapes';

/**
 * Creates the array shape.
 *
 * @param shapes The mapping from an object key to a corresponding shape.
 * @param options The constraint options.
 */
export function object<P extends ObjectLike<AnyShape>>(shapes: P, options?: InputConstraintOptions): ObjectShape<P> {
  return new ObjectShape<P>(shapes, null, options);
}
