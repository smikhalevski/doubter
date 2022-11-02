import { Message, Primitive, Tuple, TypeConstraintOptions } from '../shared-types';
import { EnumShape } from '../shapes';
import { isArray, isFinite } from '../lang-utils';

/**
 * The shape that constrains input with the list of primitive values.
 *
 * @param values The list of values allowed for the input.
 * @param options The constraint options or an issue message.
 */
function _enum<T extends Primitive, U extends Tuple<T>>(
  values: U,
  options?: TypeConstraintOptions | Message
): EnumShape<U[number]>;

/**
 * The shape that constrains input with values of [the enum-like object](https://www.typescriptlang.org/docs/handbook/enums.html).
 *
 * @param values The enum-like object.
 * @param options The constraint options or an issue message.
 */
function _enum<U extends { [name: string]: string | number }>(
  values: U,
  options?: TypeConstraintOptions | Message
): EnumShape<U[keyof U]>;

function _enum(
  values: Tuple<Primitive> | { [name: string]: string | number },
  options?: TypeConstraintOptions | Message
): EnumShape<any> {
  if (isArray(values)) {
    return new EnumShape(values, options);
  }

  const enumValues = [];

  for (const value of Object.values(values)) {
    if (!isFinite(values[value])) {
      enumValues.push(value);
    }
  }

  return new EnumShape(enumValues, options);
}

// noinspection ReservedWordAsName
export { _enum as enum };
