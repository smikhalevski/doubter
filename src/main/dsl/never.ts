import { NeverShape } from '../shapes';
import { InputConstraintOptions } from '../shared-types';

/**
 * Creates the shape that always raises an issue.
 */
export function never(options?: InputConstraintOptions): NeverShape {
  return new NeverShape(options);
}
