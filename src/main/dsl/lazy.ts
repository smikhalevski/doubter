import { AnyShape, LazyShape } from '../shapes';

/**
 * Creates the sync lazy-loaded shape.
 *
 * @param provider The provider that returns the base shape.
 */
export function lazy<S extends AnyShape>(provider: () => S): LazyShape<S> {
  return new LazyShape(provider, false);
}

/**
 * Creates the sync lazy-loaded shape that only supports async parsing.
 *
 * @param provider The provider that returns the base shape.
 */
export function lazyAsync<S extends AnyShape>(provider: () => S): LazyShape<S> {
  return new LazyShape(provider, true);
}
