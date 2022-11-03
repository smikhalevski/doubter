import { AnyShape, DefaultableShape } from '../shapes';

/**
 * Marks the type as optional.
 *
 * @param shape The shape that must be optional.
 * @param defaultValue The value that should be used if input is `undefined`.
 */
export function optional<S extends AnyShape, O extends S['output'] | undefined = S['output'] | undefined>(
  shape: S,
  defaultValue?: O
): DefaultableShape<S, S['input'] | undefined, O> {
  return new DefaultableShape(shape, undefined, defaultValue);
}
