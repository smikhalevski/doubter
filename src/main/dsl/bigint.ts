import { BigIntShape } from '../shapes';
import { InputConstraintOptions } from '../shared-types';

/**
 * Creates the bigint shape.
 */
export function bigint(options?: InputConstraintOptions): BigIntShape {
  return new BigIntShape(options);
}
