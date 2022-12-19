import { Message, TypeConstraintOptions } from '../shared-types';
import { ConstShape } from '../shapes';

/**
 * Requires an input to be `undefined`.
 *
 * @param options The constraint options or an issue message.
 */
function undefined_(options?: TypeConstraintOptions | Message): ConstShape<undefined> {
  return new ConstShape(undefined, options);
}

// noinspection ReservedWordAsName
export { undefined_ as undefined };
