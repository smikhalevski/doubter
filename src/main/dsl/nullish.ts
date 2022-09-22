import { AnyShape, NullableShape, OptionalShape } from '../shapes';
import { nullable } from './nullable';
import { optional } from './optional';

/**
 * Creates the shape that allows both `undefined` and `null` values.
 *
 * @param shape The underlying shape.
 * @param defaultValue The value that should be used if input is `undefined`.
 */
export function nullish<S extends AnyShape, O extends S['output'] | undefined = undefined>(
  shape: S,
  defaultValue?: O
): OptionalShape<NullableShape<S>, O> {
  return optional(nullable(shape), defaultValue);
}
