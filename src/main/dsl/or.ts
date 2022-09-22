import { AnyShape, UnionShape } from '../shapes';
import { InputConstraintOptionsOrMessage, Tuple } from '../shared-types';

/**
 * Creates a union shape that tries to parse the input with one of the provided types.
 *
 * @param shapes The list of shapes to try.
 * @param options The constraint options or an issue message.
 */
export function or<U extends Tuple<AnyShape>>(shapes: U, options?: InputConstraintOptionsOrMessage): UnionShape<U> {
  return new UnionShape<U>(shapes, options);
}
