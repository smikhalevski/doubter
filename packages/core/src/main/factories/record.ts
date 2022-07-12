import { RecordType, StringType, Type } from '../types';

export function record<V extends Type>(valueType: V): RecordType<StringType, V>;

export function record<K extends Type<string> | Type<number>, V extends Type>(
  keyType: K,
  valueType: V
): RecordType<K, V>;

export function record(keyType: Type, valueType?: Type) {
  if (valueType === undefined) {
    valueType = keyType;
    keyType = new StringType();
  }
  return new RecordType(keyType, valueType);
}
