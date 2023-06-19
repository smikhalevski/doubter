import { StringShape } from '../shape';
import { ConstraintOptions, Message } from '../types';

/**
 * Creates the string shape.
 *
 * @param options The constraint options or an issue message.
 * @group DSL
 */
export function string(options?: ConstraintOptions | Message): StringShape {
  return new StringShape(options);
}
