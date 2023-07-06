import { NeverShape } from '../shape';
import { IssueOptions, Message } from '../types';

/**
 * Creates the shape that always raises an issue.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function never(options?: IssueOptions | Message): NeverShape {
  return new NeverShape(options);
}
