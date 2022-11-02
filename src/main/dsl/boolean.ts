import { BooleanShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

/**
 * Creates the boolean shape.
 */
export function boolean(options?: TypeConstraintOptions | Message): BooleanShape {
  return new BooleanShape(options);
}
