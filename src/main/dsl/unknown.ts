import { Shape } from '../shape/Shape';

/**
 * Creates the unconstrained shape with unknown value.
 *
 * @group DSL
 */
export function unknown(): Shape<unknown> {
  return new Shape();
}
