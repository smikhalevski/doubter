import { ConstShape } from '../shape/ConstShape.js';
import { IssueOptions, Message } from '../types.js';

/**
 * Creates the shape that requires an input to be equal to `undefined`.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function undefined_(options?: IssueOptions | Message): ConstShape<undefined> {
  return new ConstShape(undefined, options);
}
