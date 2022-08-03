import { NeverType } from '../types';
import { ConstraintOptions } from '../shared-types';

/**
 * Creates the type definition that always raises an issue.
 */
export function never(options?: ConstraintOptions): NeverType {
  return new NeverType(options);
}
