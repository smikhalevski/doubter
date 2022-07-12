import { LazyType, Type } from '../types';

/**
 * Returns the type definition that is lazily resolved at parse time.
 */
export function lazy<X extends Type>(typeProvider: () => X): LazyType<X> {
  return new LazyType(typeProvider);
}
