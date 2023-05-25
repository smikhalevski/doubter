import { AnyShape, IntersectionShape } from '../shapes';
import { ConstraintOptions, Message } from '../types';

/**
 * Creates an intersection shape that tries to parse the input with all provided shapes.
 *
 * @param shapes The array of shapes.
 * @param options The constraint options or an issue message.
 * @template Shapes The tuple of intersected shapes.
 */
export function intersection<Shapes extends [AnyShape, ...AnyShape[]]>(
  shapes: Shapes,
  options?: ConstraintOptions | Message
): IntersectionShape<Shapes> {
  return new IntersectionShape<Shapes>(shapes, options);
}

export { intersection as and };
