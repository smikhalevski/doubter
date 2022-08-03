import { IntegerType } from '../types';
import { ConstraintOptions } from '../shared-types';

/**
 * Creates the integer type definition.
 */
export function integer(options?: ConstraintOptions): IntegerType {
  return new IntegerType(options);
}
