import { Message, TypeConstraintOptions } from '../shared-types';
import { StringShape } from '../shapes';
import { fallbackOptions } from '../utils';
import { MESSAGE_EMAIL } from '../constants';

const emailRegex =
  /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/;

/**
 * Constrains the input to email.
 *
 * @param options The constraint options or an issue message.
 */
export function email(options?: TypeConstraintOptions | Message): StringShape {
  return new StringShape(options).match(emailRegex, fallbackOptions(options, MESSAGE_EMAIL));
}
