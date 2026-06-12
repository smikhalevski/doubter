import { BigIntShape } from '../shape/BigIntShape.js';
import { IssueOptions, Message } from '../types.js';

const defaultShape = new BigIntShape();

/**
 * Creates the bigint shape.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function bigint(options?: IssueOptions | Message): BigIntShape {
  return options === undefined ? defaultShape : new BigIntShape(options);
}
