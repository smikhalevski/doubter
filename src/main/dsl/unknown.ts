import { Shape } from '../shape/Shape.js';
import { any } from './any.js';

/**
 * Creates the unconstrained shape with unknown value.
 *
 * @group DSL
 */
export function unknown(): Shape<unknown> {
  return any();
}
