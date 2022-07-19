import { RecordType, StringType, Type } from '../types';

export function record<V extends Type>(valueType: V): RecordType<StringType, V>;

export function record<K extends Type<string> | Type<number> | Type<string | number>, V extends Type>(
  keyType: K,
  valueType: V
): RecordType<K, V>;

export function record(keyType: Type, valueType?: Type) {
  return valueType === undefined ? new RecordType(keyType, null) : new RecordType(keyType, valueType);
}
