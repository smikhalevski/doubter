import { InputConstraintOptions, Primitive, Tuple } from '../shared-types';
import { EnumShape } from '../shapes';
import { isArray } from '../utils';

/**
 * The shape that constrains input with the list of primitive values.
 *
 * @param values The list of values allowed for the input.
 * @param options The constraint options.
 */
function _enum<T extends Primitive, U extends Tuple<T>>(
  values: U,
  options?: InputConstraintOptions
): EnumShape<U[number]>;

/**
 * The shape that constrains input with values of [the enum-like object](https://www.typescriptlang.org/docs/handbook/enums.html).
 *
 * @param values The enum-like object.
 * @param options The constraint options.
 */
function _enum<U extends { [name: string]: string | number }>(
  values: U,
  options?: InputConstraintOptions
): EnumShape<U[keyof U]>;

function _enum(
  values: Tuple<Primitive> | { [name: string]: string | number },
  options?: InputConstraintOptions
): EnumShape<any> {
  if (isArray(values)) {
    return new EnumShape(values, options);
  }

  const enumValues = [];

  for (const value of Object.values(values)) {
    if (typeof values[value] !== 'number') {
      enumValues.push(value);
    }
  }

  return new EnumShape(enumValues, options);
}

// noinspection ReservedWordAsName
export { _enum as enum };
