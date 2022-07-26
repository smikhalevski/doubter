import { AnyType, RecordType, Type } from '../types';

export function record<K extends Type<string>, V extends AnyType>(keyType: K, valueType: V): RecordType<K, V> {
  return new RecordType(keyType, valueType);
}
