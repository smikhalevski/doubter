import { AnyShape, OptionalShape } from '../shapes';

/**
 * Marks the type as optional.
 *
 * @param shape The shape that must be optional.
 * @param defaultValue The value that should be used if input is `undefined`.
 */
export function optional<S extends AnyShape, O extends S['output'] | undefined = undefined>(
  shape: S,
  defaultValue?: S['output'] | O
): OptionalShape<S, O> {
  return new OptionalShape(shape, defaultValue);
}
