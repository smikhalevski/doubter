import { NumberShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

/**
 * Creates the finite number shape that doesn't allow `Infinity` and `NaN` values.
 *
 * @param options The constraint options or an issue message.
 */
export function number(options?: TypeConstraintOptions | Message): NumberShape {
  return new NumberShape(options);
}
