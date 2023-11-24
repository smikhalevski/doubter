import { BooleanShape } from '../shape/BooleanShape';
import { IssueOptions, Message } from '../types';

/**
 * Creates the boolean shape.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function boolean(options?: IssueOptions | Message): BooleanShape {
  return new BooleanShape(options);
}
