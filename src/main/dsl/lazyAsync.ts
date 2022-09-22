import { AnyShape, LazyShape } from '../shapes';

/**
 * Returns the shape that is lazily resolved at parse time.
 *
 * @param provider Returns the shape that must be applied to the input.
 *
 * @template S The shape returned by the provider.
 */
export function lazyAsync<S extends AnyShape>(provider: () => S): LazyShape<S> {
  return new LazyShape(true, provider);
}
