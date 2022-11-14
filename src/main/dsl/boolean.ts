import { BooleanShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

/**
 * Creates the boolean shape.
 *
 * @param options The constraint options or an issue message.
 */
export function boolean(options?: TypeConstraintOptions | Message): BooleanShape {
  return new BooleanShape(options);
}
