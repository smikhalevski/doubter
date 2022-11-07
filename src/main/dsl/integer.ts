import { NumberShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

/**
 * Creates the integer shape that rejects `Infinity` and `NaN` values.
 */
export function integer(options?: TypeConstraintOptions | Message): NumberShape {
  return new NumberShape(options).integer(options);
}
