import { UnconstrainedType } from '../types';

/**
 * Creates the unconstrained type definition that accepts any value.
 */
export function any(): UnconstrainedType<any> {
  return new UnconstrainedType();
}
