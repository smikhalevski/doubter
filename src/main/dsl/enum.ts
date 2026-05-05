import { EnumShape } from '../shape/EnumShape.js';
import { Any, IssueOptions, Message } from '../types.js';

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
 * @template ValuesRecord The object that maps from the key to an enum value.
 * @group DSL
 */
export function enum_<Value extends Any, ValuesRecord extends Record<string, Value>>(
  values: ValuesRecord,
  options?: IssueOptions | Message
): EnumShape<ValuesRecord[keyof ValuesRecord]>;

export function enum_(source: any[] | Record<string, any>, options?: IssueOptions | Message): EnumShape<any> {
  return new EnumShape(source, options);
}
