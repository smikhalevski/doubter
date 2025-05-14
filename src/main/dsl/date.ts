import { DateShape } from '../shape/DateShape.js';
import { IssueOptions, Message } from '../types.js';

/**
 * Creates the {@link !Date} shape.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function date(options?: IssueOptions | Message): DateShape {
  return new DateShape(options);
}
