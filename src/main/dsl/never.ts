import { NeverShape } from '../shapes';
import { InputConstraintOptionsOrMessage } from '../shared-types';

/**
 * Creates the shape that always raises an issue.
 */
export function never(options?: InputConstraintOptionsOrMessage): NeverShape {
  return new NeverShape(options);
}
