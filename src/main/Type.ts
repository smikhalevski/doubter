import { isArray } from './internal/lang.js';

/**
 * The enum-like class that describes a value type.
 *
 * @template T The name of the value type.
 * @see {@link Shape.inputs}
 * @group Type Inference
 */
export class Type<T extends string = string> {
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
  ) {}

  /**
   * Returns the type of the given value. If value is a type itself, it is returned as is.
   *
   * @param value The value to get type of.
   * @return The type of the value.
   */
  static of(value: unknown): Type {
    const type = typeof value;

    if (type === 'undefined') {
      return Type.UNDEFINED;
    }
    if (type === 'boolean') {
      return Type.BOOLEAN;
    }
    if (type === 'number') {
      return Type.NUMBER;
    }
    if (type === 'string') {
      return Type.STRING;
    }
    if (type === 'function') {
      return Type.FUNCTION;
    }
    if (type === 'symbol') {
      return Type.SYMBOL;
    }
    if (type === 'bigint') {
      return Type.BIGINT;
    }
    if (value === null) {
      return Type.NULL;
    }
    if (isArray(value)) {
      return Type.ARRAY;
    }
    if (value instanceof Type) {
      return value;
    }
    if (value instanceof Date) {
      return Type.DATE;
    }
    if (value instanceof Promise) {
      return Type.PROMISE;
    }
    if (value instanceof Set) {
      return Type.SET;
    }
    if (value instanceof Map) {
      return Type.MAP;
    }
    return Type.OBJECT;
  }

  /**
   * @internal
   */
  toString(): string {
    return this.name;
  }
}
