import { AnyShape, IntersectionShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

/**
 * Creates an intersection shape that tries to parse the input with all provided shapes.
 *
 * @param shapes The list of shapes.
 * @param options The constraint options or an issue message.
 * @template U The tuple of intersected shapes.
 */
export function intersection<U extends [AnyShape, ...AnyShape[]]>(
  shapes: U,
  options?: TypeConstraintOptions | Message
): IntersectionShape<U> {
  return new IntersectionShape<U>(shapes, options);
}

export { intersection as and };
