import { ConstShape } from '../shape';
import { ConstraintOptions, Message } from '../types';

/**
 * Creates the shape that requires an input to be equal to `NaN`.
 *
 * @param options The constraint options or an issue message.
 * @group DSL
 */
export function nan(options?: ConstraintOptions | Message): ConstShape<number> {
  return new ConstShape(NaN, options);
}
