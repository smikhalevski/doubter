import { Message, TypeConstraintOptions } from '../shared-types';
import { ConstShape } from '../shapes';

/**
 * Requires an input to be `NaN`.
 *
 * @param options The constraint options or an issue message.
 */
export function nan(options?: TypeConstraintOptions | Message): ConstShape<number> {
  return new ConstShape(NaN, options);
}
