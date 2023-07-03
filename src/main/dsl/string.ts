import { StringShape } from '../shape';
import { IssueOptions, Message } from '../types';

/**
 * Creates the string shape.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function string(options?: IssueOptions | Message): StringShape {
  return new StringShape(options);
}
