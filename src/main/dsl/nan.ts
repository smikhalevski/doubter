import { ConstShape } from '../shape/ConstShape.ts';
import { IssueOptions, Message } from '../types.ts';

/**
 * Creates the shape that requires an input to be equal to `NaN`.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function nan(options?: IssueOptions | Message): ConstShape<number> {
  return new ConstShape(NaN, options);
}
