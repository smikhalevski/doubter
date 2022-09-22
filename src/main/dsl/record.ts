import { AnyShape, RecordShape, Shape } from '../shapes';
import { InputConstraintOptionsOrMessage } from '../shared-types';

export function record<K extends Shape<string>, V extends AnyShape>(
  keyShape: K,
  valueShape: V,
  options?: InputConstraintOptionsOrMessage
): RecordShape<K, V> {
  return new RecordShape(keyShape, valueShape, options);
}
