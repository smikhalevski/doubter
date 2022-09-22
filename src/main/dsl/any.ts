import { UnconstrainedShape } from '../shapes';

/**
 * Creates the unconstrained shape.
 */
export function any<T = any>(): UnconstrainedShape<T> {
  return new UnconstrainedShape();
}
