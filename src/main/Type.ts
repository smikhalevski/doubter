import { freeze, isArray } from './internal/lang';

export type TypeArray = readonly unknown[];

/**
 * The name of the value type.
 *
 * @group Type Inference
 */
export type TypeName =
  | 'array'
  | 'bigint'
  | 'boolean'
  | 'date'
  | 'function'
  | 'map'
  | 'null'
  | 'number'
  | 'object'
  | 'promise'
  | 'set'
  | 'string'
  | 'symbol'
  | 'undefined'
  | 'unknown';

/**
 * The enum-like class that describes a value type.
 *
 * @template T The name of the value type.
 * @see {@link Shape.inputs}
 * @group Type Inference
 */
export class Type<T extends TypeName = TypeName> {
  static readonly ARRAY = new Type('array');
  static readonly BIGINT = new Type('bigint');
  static readonly BOOLEAN = new Type('boolean');
  static readonly DATE = new Type('date');
  static readonly FUNCTION = new Type('function');
  static readonly MAP = new Type('map');
  static readonly NULL = new Type('null');
  static readonly NUMBER = new Type('number');
  static readonly OBJECT = new Type('object');
  static readonly PROMISE = new Type('promise');
  static readonly SET = new Type('set');
  static readonly STRING = new Type('string');
  static readonly SYMBOL = new Type('symbol');
  static readonly UNDEFINED = new Type('undefined');
  static readonly UNKNOWN = new Type('unknown');

  private constructor(
    /**
     * The name of the type.
     */
    readonly name: T
  ) {
    freeze(this);
  }

  /**
   * Returns the type of the given value. If value is a type itself, it is returned as is.
   */
  static of(value: unknown): Type {
    return getTypeOf(value);
  }

  /**
   * @internal
   */
  toString(): string {
    return this.name;
  }
}

freeze(Type);

export const TYPE_ARRAY = Type.ARRAY;
export const TYPE_BIGINT = Type.BIGINT;
export const TYPE_BOOLEAN = Type.BOOLEAN;
export const TYPE_DATE = Type.DATE;
export const TYPE_FUNCTION = Type.FUNCTION;
export const TYPE_MAP = Type.MAP;
export const TYPE_NULL = Type.NULL;
export const TYPE_NUMBER = Type.NUMBER;
export const TYPE_OBJECT = Type.OBJECT;
export const TYPE_PROMISE = Type.PROMISE;
export const TYPE_SET = Type.SET;
export const TYPE_STRING = Type.STRING;
export const TYPE_SYMBOL = Type.SYMBOL;
export const TYPE_UNDEFINED = Type.UNDEFINED;
export const TYPE_UNKNOWN = Type.UNKNOWN;

export function getTypeOf(value: unknown): Type {
  const type = typeof value;

  if (type === 'undefined') {
    return TYPE_UNDEFINED;
  }
  if (type === 'boolean') {
    return TYPE_BOOLEAN;
  }
  if (type === 'number') {
    return TYPE_NUMBER;
  }
  if (type === 'string') {
    return TYPE_STRING;
  }
  if (type === 'function') {
    return TYPE_FUNCTION;
  }
  if (type === 'symbol') {
    return TYPE_SYMBOL;
  }
  if (type === 'bigint') {
    return TYPE_BIGINT;
  }
  if (value === null) {
    return TYPE_NULL;
  }
  if (isArray(value)) {
    return TYPE_ARRAY;
  }
  if (value instanceof Type) {
    return value;
  }
  if (value instanceof Date) {
    return TYPE_DATE;
  }
  if (value instanceof Promise) {
    return TYPE_PROMISE;
  }
  if (value instanceof Set) {
    return TYPE_SET;
  }
  if (value instanceof Map) {
    return TYPE_MAP;
  }
  return TYPE_OBJECT;
}
