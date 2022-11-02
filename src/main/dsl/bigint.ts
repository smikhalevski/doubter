import { BigIntShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

/**
 * Creates the bigint shape.
 */
export function bigint(options?: TypeConstraintOptions | Message): BigIntShape {
  return new BigIntShape(options);
}
