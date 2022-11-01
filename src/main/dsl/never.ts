import { NeverShape } from '../shapes';
import { Message, TypeCheckOptions } from '../shared-types';

/**
 * Creates the shape that always raises an issue.
 */
export function never(options?: TypeCheckOptions | Message): NeverShape {
  return new NeverShape(options);
}
