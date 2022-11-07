import { NumberShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

/**
 * Creates the finite number shape that rejects `Infinity` and `NaN` values.
 */
export function finite(options?: TypeConstraintOptions | Message): NumberShape {
  return new NumberShape(options).finite(options);
}
