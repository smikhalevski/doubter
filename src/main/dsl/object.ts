import { ReadonlyDict } from '../internal/objects.ts';
import { ObjectShape } from '../shape/ObjectShape.ts';
import { AnyShape } from '../shape/Shape.ts';
import { IssueOptions, Message } from '../types.ts';

/**
 * Creates the object shape.
 *
 * @param shapes The mapping from an object key to a corresponding shape.
 * @param options The issue options or the issue message.
 * @template PropShapes The mapping from a string object key to a corresponding value shape.
 * @group DSL
 */
export function object<PropShapes extends ReadonlyDict<AnyShape>>(
  shapes: PropShapes,
  options?: IssueOptions | Message
): ObjectShape<PropShapes, null> {
  return new ObjectShape(shapes, null, options);
}
