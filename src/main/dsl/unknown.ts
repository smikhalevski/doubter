import { Shape } from '../shape/Shape.ts';

/**
 * Creates the unconstrained shape with unknown value.
 *
 * @group DSL
 */
export function unknown(): Shape<unknown> {
  return new Shape();
}
