import { Message, TypeConstraintOptions } from '../shared-types';
import { ConstShape } from '../shapes';

/**
 * Requires an input to be `null`.
 *
 * @param options The constraint options or an issue message.
 */
function null_(options?: TypeConstraintOptions | Message): ConstShape<null> {
  return new ConstShape(null, options);
}

// noinspection ReservedWordAsName
export { null_ as null };
