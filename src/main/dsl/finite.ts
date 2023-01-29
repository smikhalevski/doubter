import { NumberShape } from '../shapes';
import { ConstraintOptions, Message } from '../shared-types';

/**
 * Creates the finite number shape.
 *
 * @param options The constraint options or an issue message.
 */
export function finite(options?: ConstraintOptions | Message): NumberShape {
  return new NumberShape(options).finite();
}
