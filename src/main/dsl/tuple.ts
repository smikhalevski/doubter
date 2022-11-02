import { AnyShape, TupleShape } from '../shapes';
import { Message, Tuple, TypeConstraintOptions } from '../shared-types';

/**
 * Creates the tuple shape.
 *
 * @param types The list of tuple elements.
 * @param options The constraint options or an issue message.
 */
export function tuple<U extends Tuple<AnyShape>>(types: U, options?: TypeConstraintOptions | Message): TupleShape<U> {
  return new TupleShape<U>(types, options);
}
