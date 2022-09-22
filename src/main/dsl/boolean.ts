import { BooleanShape } from '../shapes';
import { InputConstraintOptionsOrMessage } from '../shared-types';

/**
 * Creates the boolean shape.
 */
export function boolean(options?: InputConstraintOptionsOrMessage): BooleanShape {
  return new BooleanShape(options);
}
