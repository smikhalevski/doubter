import { NumberShape } from '../shapes';
import { InputConstraintOptionsOrMessage } from '../shared-types';

/**
 * Creates the number shape.
 */
export function number(options?: InputConstraintOptionsOrMessage): NumberShape {
  return new NumberShape(options);
}
