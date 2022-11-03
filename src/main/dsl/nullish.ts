import { AnyShape, NullableShape, OptionalShape } from '../shapes';
import { nullable } from './nullable';
import { optional } from './optional';

/**
 * Creates the shape that allows both `undefined` and `null` values.
 *
 * @param shape The underlying shape.
 * @param defaultValue The value that should be used if input is `undefined` or `null`.
 */
export function nullish<S extends AnyShape, T extends S['output'] | null | undefined = S['output'] | null | undefined>(
  shape: S,
  defaultValue?: T
): OptionalShape<NullableShape<S, T>, T> {
  return optional(nullable(shape, defaultValue), defaultValue);
}
