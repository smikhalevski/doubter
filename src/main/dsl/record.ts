import { defaultKeyShape, RecordShape } from '../shape/RecordShape';
import { AnyShape, Shape } from '../shape/Shape';
import { IssueOptions, Message } from '../types';

/**
 * Creates the shape that describes an object with string keys and values that conform the given shape.
 *
 * @param valuesShape The shape of record values.
 * @param options The issue options or the issue message.
 * @template ValuesShape The shape of record values.
 * @group DSL
 */
export function record<ValuesShape extends AnyShape>(
  valuesShape: ValuesShape,
  options?: IssueOptions | Message
): RecordShape<Shape, ValuesShape>;

/**
 * Creates the shape that describes an object with string keys and values that conform the given shape.
 *
 * @param keysShape The shape of record keys.
 * @param valuesShape The shape of record values.
 * @param options The issue options or the issue message.
 * @template KeysShape The shape of record keys.
 * @template ValuesShape The shape of record values.
 * @group DSL
 */
export function record<KeysShape extends Shape<string, PropertyKey>, ValuesShape extends AnyShape>(
  keysShape: KeysShape,
  valuesShape: ValuesShape,
  options?: IssueOptions | Message
): RecordShape<KeysShape, ValuesShape>;

export function record(
  keysShape: AnyShape,
  valuesShape?: AnyShape | IssueOptions | Message,
  options?: IssueOptions | Message
) {
  if (valuesShape instanceof Shape) {
    return new RecordShape(keysShape, valuesShape, options);
  } else {
    return new RecordShape(defaultKeyShape, keysShape, options);
  }
}
