import { EnumShape } from '../shapes';
import { ConstraintOptions, Literal, Message } from '../types';
import { ReadonlyDict } from '../utils';

/**
 * Creates the shape that constrains input with the array of values.
 *
 * @param values The array of values allowed for the input.
 * @param options The constraint options or an issue message.
 * @template T Allowed values.
 * @template U The array of allowed values.
 */
function enum_<T extends Literal, U extends readonly [T, ...T[]]>(
  values: U,
  options?: ConstraintOptions | Message
): EnumShape<U[number]>;

/**
 * Creates the shape that constrains input with values of
 * [the enum-like object](https://www.typescriptlang.org/docs/handbook/enums.html).
 *
 * @param valueMapping The native enum or a mapping object.
 * @param options The constraint options or an issue message.
 * @template T Allowed values.
 * @template U The object that maps from the key to an enum value.
 */
function enum_<T extends Literal, U extends ReadonlyDict<T>>(
  valueMapping: U,
  options?: ConstraintOptions | Message
): EnumShape<U[keyof U]>;

function enum_(source: any[] | ReadonlyDict, options?: ConstraintOptions | Message): EnumShape<any> {
  return new EnumShape(source, options);
}

// noinspection ReservedWordAsName
export { enum_ as enum };
