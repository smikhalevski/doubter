import { BigIntShape } from '../shapes';
import { ConstraintOptions, Message } from '../shared-types';

/**
 * Creates the bigint shape.
 *
 * @param options The constraint options or an issue message.
 */
export function bigint(options?: ConstraintOptions | Message): BigIntShape {
  return new BigIntShape(options);
}
