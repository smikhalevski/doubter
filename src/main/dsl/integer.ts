import { IntegerShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

/**
 * Creates the integer shape.
 */
export function integer(options?: TypeConstraintOptions | Message): IntegerShape {
  return new IntegerShape(options);
}
