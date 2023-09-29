import { BigIntShape } from '../shape/BigIntShape';
import { IssueOptions, Message } from '../typings';

/**
 * Creates the bigint shape.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function bigint(options?: IssueOptions | Message): BigIntShape {
  return new BigIntShape(options);
}
