import { ReadonlyDict } from '../internal/objects.js';
import { ObjectShape } from '../shape/ObjectShape.js';
import { AnyShape } from '../shape/Shape.js';
import { IssueOptions, Message } from '../types.js';

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
