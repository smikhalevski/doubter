import { IntegerShape } from '../shapes';
import { Message, TypeCheckOptions } from '../shared-types';

/**
 * Creates the integer shape.
 */
export function integer(options?: TypeCheckOptions | Message): IntegerShape {
  return new IntegerShape(options);
}
