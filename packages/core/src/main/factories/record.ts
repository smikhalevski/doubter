import { AnyType, RecordType, Type } from '../types';

export function record<V extends AnyType>(valueType: V): RecordType<Type<string>, V>;

export function record<K extends Type<string>, V extends AnyType>(keyType: K, valueType: V): RecordType<K, V>;

export function record(keyType: any, valueType?: AnyType) {
  return valueType === undefined ? new RecordType(null, keyType) : new RecordType(keyType, valueType);
}
