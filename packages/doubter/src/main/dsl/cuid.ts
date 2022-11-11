import { Message, TypeConstraintOptions } from '../shared-types';
import { StringShape } from '../shapes';
import { RegexShape } from '../shapes/RegexShape';
import { createIssueFactory } from '../utils';
import { CODE_TYPE, MESSAGE_CUID, TYPE_CUID } from '../constants';

export const cuidRegex = /^[cC][^\s-]{8,}$/;

/**
 * Creates the shape that checks that the input is a valid collision-resistant ID.
 *
 * @param options The constraint options or an issue message.
 */
export function cuid(options?: TypeConstraintOptions | Message): StringShape {
  return new RegexShape(cuidRegex, createIssueFactory(CODE_TYPE, MESSAGE_CUID, options, TYPE_CUID));
}
