import { Message, TypeConstraintOptions } from '../shared-types';
import { ConstShape } from '../shapes';

/**
 * Creates the shape that requires an input to equal to `NaN`.
 *
 * @param options The constraint options or an issue message.
 */
export function nan(options?: TypeConstraintOptions | Message): ConstShape<number> {
  return new ConstShape(NaN, options);
}
