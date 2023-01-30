import { ConstraintOptions, Literal, Message } from '../shared-types';
import { ConstShape } from '../shapes';

/**
 * Creates the constant value shape.
 *
 * @param value The value to which the input must be strictly equal.
 * @param options The constraint options or an issue message.
 * @template T The expected value.
 */
function const_<T extends Literal>(value: T, options?: ConstraintOptions | Message): ConstShape<T> {
  return new ConstShape(value, options);
}

// noinspection ReservedWordAsName
export { const_ as const };
