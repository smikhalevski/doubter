import { BooleanShape } from '../shapes';
import { InputConstraintOptions } from '../shared-types';

/**
 * Creates the boolean shape.
 */
export function boolean(options?: InputConstraintOptions): BooleanShape {
  return new BooleanShape(options);
}
