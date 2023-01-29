import { BooleanShape } from '../shapes';
import { ConstraintOptions, Message } from '../shared-types';

/**
 * Creates the boolean shape.
 *
 * @param options The constraint options or an issue message.
 */
export function boolean(options?: ConstraintOptions | Message): BooleanShape {
  return new BooleanShape(options);
}

export { boolean as bool };
