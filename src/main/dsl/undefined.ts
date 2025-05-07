import { ConstShape } from '../shape/ConstShape.ts';
import { IssueOptions, Message } from '../types.ts';

/**
 * Creates the shape that requires an input to be equal to `undefined`.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function undefined_(options?: IssueOptions | Message): ConstShape<undefined> {
  return new ConstShape(undefined, options);
}
