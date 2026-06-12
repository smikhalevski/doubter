import { ConstShape } from '../shape/ConstShape.js';
import { IssueOptions, Message } from '../types.js';

const defaultShape = new ConstShape(undefined);

/**
 * Creates the shape that requires an input to be equal to `undefined`.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function undefined_(options?: IssueOptions | Message): ConstShape<undefined> {
  return options === undefined ? defaultShape : new ConstShape(undefined, options);
}
