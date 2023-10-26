import { ConstShape } from '../shape/ConstShape';
import { IssueOptions, Message } from '../typings';

/**
 * Creates a shape that requires an input to be `undefined` at runtime and typed as `void`.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function void_(options?: IssueOptions | Message): ConstShape<void> {
  return new ConstShape(undefined, options);
}
