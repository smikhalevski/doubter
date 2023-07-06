import { NumberShape } from '../shape';
import { IssueOptions, Message } from '../types';

/**
 * Creates the number shape.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function number(options?: IssueOptions | Message): NumberShape {
  return new NumberShape(options);
}
