import { ConstShape } from '../shape';
import { IssueOptions, Message } from '../types';

/**
 * Creates a shape that requires an input to be `undefined` at runtime and typed as `void`.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
function void_(options?: IssueOptions | Message): ConstShape<void> {
  return new ConstShape(undefined, options);
}

// noinspection ReservedWordAsName
export { void_ as void };
