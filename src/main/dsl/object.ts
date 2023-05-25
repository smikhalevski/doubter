import { AnyShape, ObjectShape } from '../shapes';
import { ConstraintOptions, Message } from '../types';
import { ReadonlyDict } from '../utils';

/**
 * Creates the object shape.
 *
 * @param shapes The mapping from an object key to a corresponding shape.
 * @param options The constraint options or an issue message.
 * @template PropShapes The mapping from a string object key to a corresponding value shape.
 */
export function object<PropShapes extends ReadonlyDict<AnyShape>>(
  shapes: PropShapes,
  options?: ConstraintOptions | Message
): ObjectShape<PropShapes, null> {
  return new ObjectShape(shapes, null, options);
}
