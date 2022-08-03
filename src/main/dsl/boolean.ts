import { BooleanType } from '../types';
import { ConstraintOptions } from '../shared-types';

/**
 * Creates the boolean type definition.
 */
export function boolean(options?: ConstraintOptions): BooleanType {
  return new BooleanType(options);
}
