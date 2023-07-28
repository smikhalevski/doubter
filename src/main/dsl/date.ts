import { DateShape } from '../shape';
import { IssueOptions, Message } from '../types';

/**
 * Creates the {@link !Date Date} shape.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function date(options?: IssueOptions | Message): DateShape {
  return new DateShape(options);
}
