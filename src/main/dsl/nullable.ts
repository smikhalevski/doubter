import { AnyShape, NullableShape } from '../shapes';

/**
 * Creates the nullable shape.
 *
 * @param shape The underlying shape.
 * @param defaultValue The value that should be used if input is `undefined`.
 */
export function nullable<S extends AnyShape, T extends S['output'] | null = S['output'] | null>(
  shape: S,
  defaultValue?: T
): NullableShape<S, T> {
  return new NullableShape(shape, defaultValue);
}
