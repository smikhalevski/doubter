import { AnyShape, UnionShape } from '../shapes';
import { ConstraintOptions, Message } from '../types';

/**
 * Creates a union shape that tries to parse the input with one of the provided shapes.
 *
 * @param shapes The array of shapes to try.
 * @param options The constraint options or an issue message.
 * @template U The tuple of united shapes.
 */
export function union<U extends [AnyShape, ...AnyShape[]]>(
  shapes: U,
  options?: ConstraintOptions | Message
): UnionShape<U> {
  return new UnionShape<U>(shapes, options);
}

export { union as or };
