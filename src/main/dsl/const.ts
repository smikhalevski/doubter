import { Any, Message, TypeConstraintOptions } from '../shared-types';
import { EnumShape } from '../shapes';
import { fallbackOptions } from '../utils';
import { MESSAGE_CONST } from '../constants';

/**
 * Creates the constant value shape.
 *
 * @param value The value to which the input must be equal.
 * @param options The constraint options or an issue message.
 *
 * @template T The value type.
 */
function const_<T extends Any>(value: T, options?: TypeConstraintOptions | Message): EnumShape<T> {
  return new EnumShape([value], fallbackOptions(options, MESSAGE_CONST));
}

// noinspection ReservedWordAsName
export { const_ as const };
