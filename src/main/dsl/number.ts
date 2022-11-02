import { NumberShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

/**
 * Creates the number shape.
 */
export function number(options?: TypeConstraintOptions | Message): NumberShape {
  return new NumberShape(options);
}
