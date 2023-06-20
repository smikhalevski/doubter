import { NumberShape } from '../shape';
import { ConstraintOptions, Message } from '../types';

/**
 * Creates the integer shape.
 *
 * @param options The constraint options or an issue message.
 * @group DSL
 */
export function integer(options?: ConstraintOptions | Message): NumberShape {
  return new NumberShape(options).integer(options);
}

/**
 * @group DSL
 */
export { integer as int };
