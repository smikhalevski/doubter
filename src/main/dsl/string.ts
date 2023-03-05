import { StringShape } from '../shapes';
import { ConstraintOptions, Message } from '../types';

/**
 * Creates the string shape.
 *
 * @param options The constraint options or an issue message.
 */
export function string(options?: ConstraintOptions | Message): StringShape {
  return new StringShape(options);
}
