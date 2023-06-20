import { ConstShape } from '../shape';
import { ConstraintOptions, Message } from '../types';

/**
 * Creates a shape that requires an input to be `undefined` at runtime and typed as `void`.
 *
 * @param options The constraint options or an issue message.
 * @group DSL
 */
function void_(options?: ConstraintOptions | Message): ConstShape<void> {
  return new ConstShape(undefined, options);
}

// noinspection ReservedWordAsName
export { void_ as void };
