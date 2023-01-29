import { ConstraintOptions, Message } from '../shared-types';
import { ConstShape } from '../shapes';

/**
 * Creates a shape that requires an input to be `undefined` at runtime and typed as `void`.
 *
 * @param options The constraint options or an issue message.
 */
function void_(options?: ConstraintOptions | Message): ConstShape<void> {
  return new ConstShape(undefined, options);
}

// noinspection ReservedWordAsName
export { void_ as void };
