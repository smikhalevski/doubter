import { AnyShape, OptionalShape } from '../shapes';

/**
 * Marks the type as optional.
 *
 * @param shape The shape that must be optional.
 * @param defaultValue The value that should be used if input is `undefined`.
 */
export function optional<S extends AnyShape, T extends S['output'] | undefined = S['output'] | undefined>(
  shape: S,
  defaultValue?: T
): OptionalShape<S, T> {
  return new OptionalShape(shape, defaultValue);
}
