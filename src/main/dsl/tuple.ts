import { AnyShape, TupleShape } from '../shapes';
import { InputConstraintOptions, Tuple } from '../shared-types';

/**
 * Creates the tuple shape.
 *
 * @param types The list of tuple elements.
 * @param options The constraint options.
 */
export function tuple<U extends Tuple<AnyShape>>(types: U, options?: InputConstraintOptions): TupleShape<U> {
  return new TupleShape<U>(types, options);
}
