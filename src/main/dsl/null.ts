import { ConstShape } from '../shape/ConstShape';
import { IssueOptions, Message } from '../typings';

/**
 * Creates the shape that requires an input to be equal to `null`.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function null_(options?: IssueOptions | Message): ConstShape<null> {
  return new ConstShape(null, options);
}
