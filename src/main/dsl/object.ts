import { ReadonlyDict } from '../internal';
import { AnyShape, ObjectShape } from '../shape';
import { ConstraintOptions, Message } from '../types';

/**
 * Creates the object shape.
 *
 * @param shapes The mapping from an object key to a corresponding shape.
 * @param options The constraint options or an issue message.
 * @template PropShapes The mapping from a string object key to a corresponding value shape.
 * @group DSL
 */
export function object<PropShapes extends ReadonlyDict<AnyShape>>(
  shapes: PropShapes,
  options?: ConstraintOptions | Message
): ObjectShape<PropShapes, null> {
  return new ObjectShape(shapes, null, options);
}
