import { NeverShape } from '../shape/NeverShape.ts';
import { IssueOptions, Message } from '../types.ts';

/**
 * Creates the shape that always raises an issue.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function never(options?: IssueOptions | Message): NeverShape {
  return new NeverShape(options);
}
