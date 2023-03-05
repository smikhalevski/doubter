import { AnyShape, ObjectShape } from '../shapes';
import { ConstraintOptions, Message } from '../types';
import { ReadonlyDict } from '../utils';

/**
 * Creates the object shape.
 *
 * @param shapes The mapping from an object key to a corresponding shape.
 * @param options The constraint options or an issue message.
 */
export function object<P extends ReadonlyDict<AnyShape>>(
  shapes: P,
  options?: ConstraintOptions | Message
): ObjectShape<P, null> {
  return new ObjectShape(shapes, null, options);
}
