import { NeverShape } from '../shape';
import { ConstraintOptions, Message } from '../types';

/**
 * Creates the shape that always raises an issue.
 *
 * @param options The constraint options or an issue message.
 * @group DSL
 */
export function never(options?: ConstraintOptions | Message): NeverShape {
  return new NeverShape(options);
}
