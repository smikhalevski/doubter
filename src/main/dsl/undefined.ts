import { ConstraintOptions, Message } from '../shared-types';
import { ConstShape } from '../shapes';

/**
 * Creates the shape that requires an input to equal to `undefined`.
 *
 * @param options The constraint options or an issue message.
 */
function undefined_(options?: ConstraintOptions | Message): ConstShape<undefined> {
  return new ConstShape(undefined, options);
}

// noinspection ReservedWordAsName
export { undefined_ as undefined };
