import { IntegerShape } from '../shapes';
import { InputConstraintOptions } from '../shared-types';

/**
 * Creates the integer shape.
 */
export function integer(options?: InputConstraintOptions): IntegerShape {
  return new IntegerShape(options);
}
