import { IntegerShape } from '../shapes';
import { InputConstraintOptionsOrMessage } from '../shared-types';

/**
 * Creates the integer shape.
 */
export function integer(options?: InputConstraintOptionsOrMessage): IntegerShape {
  return new IntegerShape(options);
}
