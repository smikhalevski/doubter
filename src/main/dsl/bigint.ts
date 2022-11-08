import { BigIntShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

/**
 * Creates the bigint shape.
 *
 * @param options The constraint options or an issue message.
 */
export function bigint(options?: TypeConstraintOptions | Message): BigIntShape {
  return new BigIntShape(options);
}
