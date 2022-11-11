import { StringShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

/**
 * Creates the string shape.
 *
 * @param options The constraint options or an issue message.
 */
export function string(options?: TypeConstraintOptions | Message): StringShape {
  return new StringShape(options);
}
