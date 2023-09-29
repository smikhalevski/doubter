import { NeverShape } from '../shape/NeverShape';
import { IssueOptions, Message } from '../typings';

/**
 * Creates the shape that always raises an issue.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function never(options?: IssueOptions | Message): NeverShape {
  return new NeverShape(options);
}
