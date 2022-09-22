import { AnyShape, RecordShape, Shape } from '../shapes';
import { InputConstraintOptions } from '../shared-types';

export function record<K extends Shape<string>, V extends AnyShape>(
  keyShape: K,
  valueShape: V,
  options?: InputConstraintOptions
): RecordShape<K, V> {
  return new RecordShape(keyShape, valueShape, options);
}
