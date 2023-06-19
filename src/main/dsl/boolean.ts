import { BooleanShape } from '../shape';
import { ConstraintOptions, Message } from '../types';

/**
 * Creates the boolean shape.
 *
 * @param options The constraint options or an issue message.
 * @group DSL
 */
export function boolean(options?: ConstraintOptions | Message): BooleanShape {
  return new BooleanShape(options);
}

/**
 * @group DSL
 */
export { boolean as bool };
