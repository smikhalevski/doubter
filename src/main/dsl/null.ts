import { ConstShape } from '../shape/ConstShape.js';
import { IssueOptions, Message } from '../types.js';

/**
 * Creates the shape that requires an input to be equal to `null`.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function null_(options?: IssueOptions | Message): ConstShape<null> {
  return new ConstShape(null, options);
}
