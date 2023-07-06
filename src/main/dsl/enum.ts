import { ReadonlyDict } from '../internal';
import { EnumShape } from '../shape';
import { IssueOptions, Literal, Message } from '../types';

/**
 * Creates the shape that constrains input with the array of values.
 *
 * @param values The array of values allowed for the input.
 * @param options The issue options or the issue message.
 * @template Value The union of allowed enum values.
 * @template ValuesArray The array of allowed values.
 * @group DSL
 */
function enum_<Value extends Literal, ValuesArray extends readonly [Value, ...Value[]]>(
  values: ValuesArray,
  options?: IssueOptions | Message
): EnumShape<ValuesArray[number]>;

/**
 * Creates the shape that constrains input with values of
 * [the enum-like object](https://www.typescriptlang.org/docs/handbook/enums.html).
 *
 * @param values The native enum or a mapping object.
 * @param options The issue options or the issue message.
 * @template Value The union of allowed enum values.
 * @template ValuesDict The object that maps from the key to an enum value.
 * @group DSL
 */
function enum_<Value extends Literal, ValuesDict extends ReadonlyDict<Value>>(
  values: ValuesDict,
  options?: IssueOptions | Message
): EnumShape<ValuesDict[keyof ValuesDict]>;

function enum_(source: any[] | ReadonlyDict, options?: IssueOptions | Message): EnumShape<any> {
  return new EnumShape(source, options);
}

// noinspection ReservedWordAsName
export { enum_ as enum };
