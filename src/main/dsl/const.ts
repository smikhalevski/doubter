import { ConstShape } from '../shapes';
import { ConstraintOptions, Literal, Message } from '../types';

/**
 * Creates the constant value shape.
 *
 * @param value The value to which the input must be strictly equal.
 * @param options The constraint options or an issue message.
 * @template Value The expected value.
 */
function const_<Value extends Literal>(value: Value, options?: ConstraintOptions | Message): ConstShape<Value> {
  return new ConstShape(value, options);
}

// noinspection ReservedWordAsName
export { const_ as const };
