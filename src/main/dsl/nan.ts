import { ConstShape } from '../shape/ConstShape.js';
import { IssueOptions, Message } from '../types.js';

/**
 * Creates the shape that requires an input to be equal to `NaN`.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function nan(options?: IssueOptions | Message): ConstShape<number> {
  return new ConstShape(NaN, options);
}
