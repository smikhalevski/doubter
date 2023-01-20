import { Message, TypeConstraintOptions } from '../shared-types';
import { AnyShape, ObjectShape } from '../shapes';
import { ReadonlyDict } from '../shapes/Shape';

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
