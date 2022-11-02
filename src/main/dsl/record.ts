import { AnyShape, RecordShape, Shape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

export function record<K extends Shape<string, PropertyKey>, V extends AnyShape>(
  keyShape: K,
  valueShape: V,
  options?: TypeConstraintOptions | Message
): RecordShape<K, V> {
  return new RecordShape(keyShape, valueShape, options);
}
