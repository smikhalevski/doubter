import { ConstraintOptions, Message } from '../shared-types';
import { ConstShape } from '../shapes';

/**
 * Creates the shape that requires an input to equal to `null`.
 *
 * @param options The constraint options or an issue message.
 */
function null_(options?: ConstraintOptions | Message): ConstShape<null> {
  return new ConstShape(null, options);
}

// noinspection ReservedWordAsName
export { null_ as null };
