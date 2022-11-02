import { NeverShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

/**
 * Creates the shape that always raises an issue.
 */
export function never(options?: TypeConstraintOptions | Message): NeverShape {
  return new NeverShape(options);
}
