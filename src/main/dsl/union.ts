import { AnyShape } from '../shape/Shape.js';
import { UnionShape } from '../shape/UnionShape.js';
import { IssueOptions, Message } from '../types.js';

/**
 * Creates a union shape that tries to parse the input with one of the provided shapes.
 *
 * @param shapes The array of shapes to try.
 * @param options The issue options or the issue message.
 * @template Shapes The tuple of united shapes.
 * @group DSL
 */
export function union<Shapes extends [AnyShape, ...AnyShape[]]>(
  shapes: Shapes,
  options?: IssueOptions | Message
): UnionShape<Shapes> {
  return new UnionShape<Shapes>(shapes, options);
}
