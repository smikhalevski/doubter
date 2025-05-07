import { IntersectionShape } from '../shape/IntersectionShape.ts';
import { AnyShape } from '../shape/Shape.ts';
import { IssueOptions, Message } from '../types.ts';

/**
 * Creates an intersection shape that tries to parse the input with all provided shapes and merge parsing results.
 *
 * @param shapes The array of shapes.
 * @param options The issue options or the issue message.
 * @template Shapes The tuple of intersected shapes.
 * @group DSL
 */
export function intersection<Shapes extends [AnyShape, ...AnyShape[]]>(
  shapes: Shapes,
  options?: IssueOptions | Message
): IntersectionShape<Shapes> {
  return new IntersectionShape<Shapes>(shapes, options);
}
