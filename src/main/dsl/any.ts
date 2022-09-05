import { UnconstrainedType } from '../types';

/**
 * Creates the unconstrained type definition.
 */
export function any<O = any>(): UnconstrainedType<O> {
  return new UnconstrainedType();
}
