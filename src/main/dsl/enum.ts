import { Any, Message, ReadonlyDict, TypeConstraintOptions } from '../shared-types';
import { EnumShape } from '../shapes';
import { isArray, unique } from '../utils';

/**
 * The shape that constrains input with the list of primitive values.
 *
 * @param values The list of values allowed for the input.
 * @param options The constraint options or an issue message.
 * @template T Allowed values.
 * @template U The list of allowed values.
 */
function enum_<T extends Any, U extends readonly [T, ...T[]]>(
  values: U,
  options?: TypeConstraintOptions | Message
): EnumShape<U[number]>;

/**
 * The shape that constrains input with values of [the enum-like object](https://www.typescriptlang.org/docs/handbook/enums.html).
 *
 * @param values The native enum or a mapping object.
 * @param options The constraint options or an issue message.
 * @template T Allowed values.
 * @template U The object that maps from the key to an enum value.
 */
function enum_<T extends Any, U extends ReadonlyDict<T>>(
  values: U,
  options?: TypeConstraintOptions | Message
): EnumShape<U[keyof U]>;

function enum_(values: ReadonlyDict, options?: TypeConstraintOptions | Message): EnumShape<any> {
  return new EnumShape(
    unique(isArray(values) ? values : Object.values(values).filter(value => typeof values[value] !== 'number')),
    options
  );
}

// noinspection ReservedWordAsName
export { enum_ as enum };
