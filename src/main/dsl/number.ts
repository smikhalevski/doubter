import { NumberShape } from '../shapes';
import { InputConstraintOptions } from '../shared-types';

/**
 * Creates the number shape.
 */
export function number(options?: InputConstraintOptions): NumberShape {
  return new NumberShape(options);
}
