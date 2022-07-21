import { AnyType, LazyType } from '../types';

/**
 * Returns the type definition that is lazily resolved at parse time.
 *
 * @param typeProvider Returns the type definition that must be applied to the input.
 *
 * @template X The type definition returned by the provider.
 */
export function lazy<X extends AnyType>(typeProvider: () => X): LazyType<X> {
  return new LazyType(typeProvider);
}
