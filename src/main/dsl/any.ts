import { UnconstrainedType } from '../types';

/**
 * Creates the unconstrained type definition.
 */
export function any<T = any>(): UnconstrainedType<T> {
  return new UnconstrainedType();
}
