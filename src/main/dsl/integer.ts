import { NumberShape } from '../shape';
import { IssueOptions, Message } from '../types';

/**
 * Creates the integer shape.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function integer(options?: IssueOptions | Message): NumberShape {
  return new NumberShape(options).integer(options);
}

/**
 * @group DSL
 */
export { integer as int };
