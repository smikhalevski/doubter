import { BigIntType } from '../types';
import { ConstraintOptions } from '../shared-types';

/**
 * Creates the bigint type definition.
 */
export function bigint(options?: ConstraintOptions): BigIntType {
  return new BigIntType(options);
}
