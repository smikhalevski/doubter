import { ConstShape } from '../shape';
import { IssueOptions, Message } from '../types';

/**
 * Creates the shape that requires an input to be equal to `null`.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
function null_(options?: IssueOptions | Message): ConstShape<null> {
  return new ConstShape(null, options);
}

// noinspection ReservedWordAsName
export { null_ as null };
