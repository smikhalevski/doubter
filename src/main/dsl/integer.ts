import { NumberShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

/**
 * Creates the integer shape.
 *
 * @param options The constraint options or an issue message.
 */
export function integer(options?: TypeConstraintOptions | Message): NumberShape {
  return new NumberShape(options).integer(options);
}

export { integer as int };
