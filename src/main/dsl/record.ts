import { AnyShape, RecordShape, Shape } from '../shape';
import { ConstraintOptions, Message } from '../types';

/**
 * Creates the shape that describes an object with string keys and values that conform the given shape.
 *
 * @param valueShape The shape of the record values.
 * @param options The constraint options or an issue message.
 * @template ValueShape The value shape.
 */
export function record<ValueShape extends AnyShape>(
  valueShape: ValueShape,
  options?: ConstraintOptions | Message
): RecordShape<null, ValueShape>;

/**
 * Creates the shape that describes an object with string keys and values that conform the given shape.
 *
 * @param keyShape The shape of record keys.
 * @param valueShape The shape of the record values.
 * @param options The constraint options or an issue message.
 * @template KeyShape The key shape.
 * @template ValueShape The value shape.
 */
export function record<KeyShape extends Shape<string, PropertyKey>, ValueShape extends AnyShape>(
  keyShape: KeyShape,
  valueShape: ValueShape,
  options?: ConstraintOptions | Message
): RecordShape<KeyShape, ValueShape>;

export function record(
  keyShape: AnyShape,
  valueShape?: AnyShape | ConstraintOptions | Message,
  options?: ConstraintOptions | Message
) {
  if (valueShape instanceof Shape) {
    return new RecordShape(keyShape, valueShape, options);
  } else {
    return new RecordShape(null, keyShape, options);
  }
}
