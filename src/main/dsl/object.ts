import { Message, ReadonlyDict, TypeConstraintOptions } from '../shared-types';
import { AnyShape, ObjectShape } from '../shapes';

/**
 * Creates the object shape.
 *
 * @param shapes The mapping from an object key to a corresponding shape.
 * @param options The constraint options or an issue message.
 */
export function object<P extends ReadonlyDict<AnyShape>>(
  shapes: P,
  options?: TypeConstraintOptions | Message
): ObjectShape<P, null> {
  return new ObjectShape(shapes, null, options);
}
