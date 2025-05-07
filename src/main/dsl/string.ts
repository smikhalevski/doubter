import { StringShape } from '../shape/StringShape.js';
import { IssueOptions, Message } from '../types.js';

/**
 * Creates the string shape.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function string(options?: IssueOptions | Message): StringShape {
  return new StringShape(options);
}
