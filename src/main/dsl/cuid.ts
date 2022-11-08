import { StringShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

const cuidRegex = /^[cC][^\s-]{8,}$/;

/**
 * Constrains the input to collision-resistant ID.
 *
 * @param options The constraint options or an issue message.
 */
export function cuid(options?: TypeConstraintOptions | Message): StringShape {
  return new StringShape(options).match(cuidRegex);
}
