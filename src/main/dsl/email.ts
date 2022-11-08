import { Message, TypeConstraintOptions } from '../shared-types';
import { StringShape } from '../shapes';

const emailRegex =
  /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/;

/**
 * Constrains the input to email.
 *
 * @param options The constraint options or an issue message.
 */
export function email(options?: TypeConstraintOptions | Message): StringShape {
  return new StringShape(options).match(emailRegex);
}
