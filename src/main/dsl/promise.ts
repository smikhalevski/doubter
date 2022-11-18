import { AnyShape, PromiseShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

/**
 * Creates the shape of a value wrapped in a `Promise` instance.
 *
 * @param shape The shape of the resolved value.
 * @param options The constraint options or an issue message.
 * @template S The shape of the resolved value.
 */
export function promise<S extends AnyShape>(shape: S, options?: TypeConstraintOptions | Message): PromiseShape<S> {
  return new PromiseShape(shape, options);
}
