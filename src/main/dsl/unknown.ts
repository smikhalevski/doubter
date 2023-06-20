import { Shape } from '../shape';

/**
 * Creates the unconstrained shape with unknown value.
 *
 * @group DSL
 */
export function unknown(): Shape<unknown> {
  return new Shape();
}
