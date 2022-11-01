import { BigIntShape } from '../shapes';
import { Message, TypeCheckOptions } from '../shared-types';

/**
 * Creates the bigint shape.
 */
export function bigint(options?: TypeCheckOptions | Message): BigIntShape {
  return new BigIntShape(options);
}
