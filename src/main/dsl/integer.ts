import { NumberShape } from '../shapes';
import { ConstraintOptions, Message } from '../shared-types';

/**
 * Creates the integer shape.
 *
 * @param options The constraint options or an issue message.
 */
export function integer(options?: ConstraintOptions | Message): NumberShape {
  return new NumberShape(options).integer(options);
}

export { integer as int };
