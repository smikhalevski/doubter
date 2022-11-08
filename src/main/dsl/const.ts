import { Any, Message, TypeConstraintOptions } from '../shared-types';
import { EnumShape } from '../shapes';

/**
 * Creates the literal value shape.
 *
 * @param value The literal value to which the value must be equal.
 * @param options The constraint options or an issue message.
 *
 * @template T The type of the literal value.
 */
function const_<T extends Any>(value: T, options?: TypeConstraintOptions | Message): EnumShape<T> {
  return new EnumShape([value], options);
}

// noinspection ReservedWordAsName
export { const_ as const };
