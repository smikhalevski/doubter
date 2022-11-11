import { NeverShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

/**
 * Creates the shape that always raises an issue.
 *
 * @param options The constraint options or an issue message.
 */
export function never(options?: TypeConstraintOptions | Message): NeverShape {
  return new NeverShape(options);
}
