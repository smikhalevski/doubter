import { BigIntShape } from '../shape';
import { ConstraintOptions, Message } from '../types';

/**
 * Creates the bigint shape.
 *
 * @param options The constraint options or an issue message.
 * @group DSL
 */
export function bigint(options?: ConstraintOptions | Message): BigIntShape {
  return new BigIntShape(options);
}
