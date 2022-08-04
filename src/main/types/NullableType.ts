import { AnyType, InferType, Type } from './Type';
import { Awaitable, ParserOptions } from '../shared-types';
import { OptionalType } from './OptionalType';

/**
 * The nullable type definition.
 *
 * @template X The underlying type definition.
 */
export class NullableType<X extends AnyType> extends Type<InferType<X> | null> {
  /**
   * Creates a new {@link NullableType} instance.
   *
   * @param type The underlying type definition.
   */
  constructor(protected type: X) {
    super(type.async);
  }

  at(key: unknown): AnyType | null {
    const childType = this.type.at(key);
    return childType === null ? null : new OptionalType(childType);
  }

  parse(input: unknown, options?: ParserOptions): Awaitable<InferType<X> | null> {
    const { type } = this;

    if (input === null) {
      return type.async ? Promise.resolve(input) : input;
    }
    return type.parse(input, options);
  }
}
