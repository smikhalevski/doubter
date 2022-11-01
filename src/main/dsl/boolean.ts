import { BooleanShape } from '../shapes';
import { Message, TypeCheckOptions } from '../shared-types';

/**
 * Creates the boolean shape.
 */
export function boolean(options?: TypeCheckOptions | Message): BooleanShape {
  return new BooleanShape(options);
}
