import { Shape } from '../shape';

/**
 * Creates the unconstrained shape with unknown value.
 */
export function unknown(): Shape<unknown> {
  return new Shape();
}
