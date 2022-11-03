import { AnyShape, RecordShape, Shape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

export function record<V extends AnyShape>(
  valueShape: V,
  options?: TypeConstraintOptions | Message
): RecordShape<Shape<string>, V>;

export function record<K extends Shape<string, PropertyKey>, V extends AnyShape>(
  keyShape: K,
  valueShape: V,
  options?: TypeConstraintOptions | Message
): RecordShape<K, V>;

export function record(
  keyShape: AnyShape,
  valueShape?: AnyShape | TypeConstraintOptions | Message,
  options?: TypeConstraintOptions | Message
) {
  if (valueShape instanceof Shape) {
    return new RecordShape(keyShape, valueShape, options);
  } else {
    return new RecordShape(null, keyShape, options);
  }
}
