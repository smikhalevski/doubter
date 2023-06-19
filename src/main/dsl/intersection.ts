import { AnyShape, IntersectionShape } from '../shape';
import { ConstraintOptions, Message } from '../types';

/**
 * Creates an intersection shape that tries to parse the input with all provided shapes.
 *
 * @param shapes The array of shapes.
 * @param options The constraint options or an issue message.
 * @template Shapes The tuple of intersected shapes.
 * @group DSL
 */
export function intersection<Shapes extends [AnyShape, ...AnyShape[]]>(
  shapes: Shapes,
  options?: ConstraintOptions | Message
): IntersectionShape<Shapes> {
  return new IntersectionShape<Shapes>(shapes, options);
}

/**
 * @group DSL
 */
export { intersection as and };
