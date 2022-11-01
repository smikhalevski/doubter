import { AnyShape, RecordShape, Shape } from '../shapes';
import { Message, TypeCheckOptions } from '../shared-types';

export function record<K extends Shape<string, PropertyKey>, V extends AnyShape>(
  keyShape: K,
  valueShape: V,
  options?: TypeCheckOptions | Message
): RecordShape<K, V> {
  return new RecordShape(keyShape, valueShape, options);
}
