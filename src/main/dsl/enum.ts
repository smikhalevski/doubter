import { ReadonlyDict } from '../internal/objects.ts';
import { EnumShape } from '../shape/EnumShape.ts';
import { Any, IssueOptions, Message } from '../types.ts';

/**
 * Creates the shape that constrains input with the array of values.
 *
 * @param values The array of values allowed for the input.
 * @param options The issue options or the issue message.
 * @template Value The union of allowed enum values.
 * @template ValuesArray The array of allowed values.
 * @group DSL
 */
export function enum_<Value extends Any, ValuesArray extends readonly [Value, ...Value[]]>(
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
export function enum_<Value extends Any, ValuesDict extends ReadonlyDict<Value>>(
  values: ValuesDict,
  options?: IssueOptions | Message
): EnumShape<ValuesDict[keyof ValuesDict]>;

export function enum_(source: any[] | ReadonlyDict, options?: IssueOptions | Message): EnumShape<any> {
  return new EnumShape(source, options);
}
