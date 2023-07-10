import { ConstShape } from '../shape';
import { Any, IssueOptions, Message } from '../types';

/**
 * Creates the constant value shape.
 *
 * @param value The value to which the input must be strictly equal.
 * @param options The issue options or the issue message.
 * @template Value The expected value.
 * @group DSL
 */
function const_<Value extends Any>(value: Value, options?: IssueOptions | Message): ConstShape<Value> {
  return new ConstShape(value, options);
}

// noinspection ReservedWordAsName
export { const_ as const };
