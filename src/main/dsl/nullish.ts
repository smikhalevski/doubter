import { AnyShape, NullableShape, OptionalShape } from '../shapes';
import { nullable } from './nullable';
import { optional } from './optional';

/**
 * Creates the shape that allows both `undefined` and `null` values.
 *
 * @param shape The underlying shape.
 * @param defaultValue The value that should be used if input is `undefined`.
 */
export function nullish<S extends AnyShape, T extends S['output'] | undefined = undefined>(
  shape: S,
  defaultValue?: T
): OptionalShape<NullableShape<S>, T> {
  return optional(nullable(shape), defaultValue);
}
