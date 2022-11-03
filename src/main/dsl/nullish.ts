import { AnyShape, DefaultableShape } from '../shapes';
import { nullable } from './nullable';
import { optional } from './optional';

/**
 * Creates the shape that allows both `undefined` and `null` values.
 *
 * @param shape The underlying shape.
 * @param defaultValue The value that should be used if input is `undefined` or `null`.
 */
export function nullish<S extends AnyShape, O extends S['output'] | null | undefined = S['output'] | null | undefined>(
  shape: S,
  defaultValue?: O
): DefaultableShape<DefaultableShape<S, S['input'] | null, O>, S['input'] | null | undefined, O> {
  return optional(nullable(shape, defaultValue), defaultValue);
}
