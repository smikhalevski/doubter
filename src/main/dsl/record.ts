import { AnyType, RecordType, Type } from '../types';
import { ConstraintOptions } from '../shared-types';

export function record<K extends Type<string>, V extends AnyType>(
  keyType: K,
  valueType: V,
  options?: ConstraintOptions
): RecordType<K, V> {
  return new RecordType(keyType, valueType, options);
}
