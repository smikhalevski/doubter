import { AnyType, InferType, Type } from './Type';
import { Awaitable, ParserOptions } from '../shared-types';

/**
 * The optional type definition.
 *
 * @template X The underlying type definition.
 */
export class OptionalType<X extends AnyType> extends Type<InferType<X> | undefined> {
  /**
   * Creates a new {@link OptionalType} instance.
   *
   * @param type The underlying type definition.
   * @param defaultValue The value that should be used if input is `undefined`.
   */
  constructor(protected type: X, protected defaultValue?: InferType<X>) {
    super(type.async);
  }

  at(key: unknown): AnyType | null {
    const childType = this.type.at(key);
    return childType === null ? null : new OptionalType(childType);
  }

  parse(input: unknown, options?: ParserOptions): Awaitable<InferType<X> | undefined> {
    const { type, defaultValue } = this;

    if (input === undefined) {
      return type.async ? Promise.resolve(defaultValue) : defaultValue;
    }
    return type.parse(input, options);
  }
}
