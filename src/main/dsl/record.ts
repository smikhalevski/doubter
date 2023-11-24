import { RecordShape } from '../shape/RecordShape';
import { AnyShape, Shape } from '../shape/Shape';
import { IssueOptions, Message } from '../types';

/**
 * Creates the shape that describes an object with string keys and values that conform the given shape.
 *
 * @param valueShape The shape of the record values.
 * @param options The issue options or the issue message.
 * @template ValueShape The value shape.
 * @group DSL
 */
export function record<ValueShape extends AnyShape>(
  valueShape: ValueShape,
  options?: IssueOptions | Message
): RecordShape<null, ValueShape>;

/**
 * Creates the shape that describes an object with string keys and values that conform the given shape.
 *
 * @param keyShape The shape of record keys.
 * @param valueShape The shape of the record values.
 * @param options The issue options or the issue message.
 * @template KeyShape The key shape.
 * @template ValueShape The value shape.
 * @group DSL
 */
export function record<KeyShape extends Shape<string, PropertyKey>, ValueShape extends AnyShape>(
  keyShape: KeyShape,
  valueShape: ValueShape,
  options?: IssueOptions | Message
): RecordShape<KeyShape, ValueShape>;

export function record(
  keyShape: AnyShape,
  valueShape?: AnyShape | IssueOptions | Message,
  options?: IssueOptions | Message
) {
  if (valueShape instanceof Shape) {
    return new RecordShape(keyShape, valueShape, options);
  } else {
    return new RecordShape(null, keyShape, options);
  }
}
