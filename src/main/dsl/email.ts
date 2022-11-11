import { Message, TypeConstraintOptions } from '../shared-types';
import { StringShape } from '../shapes';
import { RegexShape } from '../shapes/RegexShape';
import { createIssueFactory } from '../utils';
import { CODE_TYPE, MESSAGE_EMAIL, TYPE_EMAIL } from '../constants';

export const emailRegex =
  /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/;

/**
 * Creates the shape that checks that the input is a valid email.
 *
 * @param options The constraint options or an issue message.
 */
export function email(options?: TypeConstraintOptions | Message): StringShape {
  return new RegexShape(emailRegex, createIssueFactory(CODE_TYPE, MESSAGE_EMAIL, options, TYPE_EMAIL));
}
