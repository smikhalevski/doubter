import { NumberShape } from '../shape';
import { ConstraintOptions, Message } from '../types';

/**
 * Creates the number shape.
 *
 * @param options The constraint options or an issue message.
 * @group DSL
 */
export function number(options?: ConstraintOptions | Message): NumberShape {
  return new NumberShape(options);
}
