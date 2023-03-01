import { AnyShape, IntersectionShape } from '../shapes';
import { ConstraintOptions, Message } from '../shared-types';

/**
 * Creates an intersection shape that tries to parse the input with all provided shapes.
 *
 * @param shapes The array of shapes.
 * @param options The constraint options or an issue message.
 * @template U The tuple of intersected shapes.
 */
export function intersection<U extends [AnyShape, ...AnyShape[]]>(
  shapes: U,
  options?: ConstraintOptions | Message
): IntersectionShape<U> {
  return new IntersectionShape<U>(shapes, options);
}

export { intersection as and };
