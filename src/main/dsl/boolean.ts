import { BooleanShape } from '../shape/BooleanShape.js';
import { IssueOptions, Message } from '../types.js';

/**
 * Creates the boolean shape.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function boolean(options?: IssueOptions | Message): BooleanShape {
  return new BooleanShape(options);
}
