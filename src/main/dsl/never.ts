import { NeverShape } from '../shape/NeverShape.js';
import { IssueOptions, Message } from '../types.js';

const defaultShape = new NeverShape();

/**
 * Creates the shape that always raises an issue.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function never(options?: IssueOptions | Message): NeverShape {
  return options === undefined ? defaultShape : new NeverShape(options);
}
