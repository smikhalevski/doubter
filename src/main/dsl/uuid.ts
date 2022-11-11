import { StringShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';
import { RegexShape } from '../shapes/RegexShape';
import { createIssueFactory } from '../utils';
import { CODE_TYPE, MESSAGE_UUID, TYPE_UUID } from '../constants';

export const uuidRegex =
  /^([a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}|00000000-0000-0000-0000-000000000000)$/i;

/**
 * Creates the shape that checks that the input is a valid UUID.
 *
 * @param options The constraint options or an issue message.
 */
export function uuid(options?: TypeConstraintOptions | Message): StringShape {
  return new RegexShape(uuidRegex, createIssueFactory(CODE_TYPE, MESSAGE_UUID, options, TYPE_UUID));
}
