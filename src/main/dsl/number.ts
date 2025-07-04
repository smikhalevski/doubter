import { NumberShape } from '../shape/NumberShape.js';
import { IssueOptions, Message } from '../types.js';

/**
 * Creates the number shape.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function number(options?: IssueOptions | Message): NumberShape {
  return new NumberShape(options);
}
