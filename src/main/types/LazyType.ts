import { AnyType, InferType, Type } from './Type';
import { Awaitable, ParserOptions } from '../shared-types';

/**
 * The lazily-evaluated type definition.
 *
 * @template X The type definition returned by the provider.
 */
export class LazyType<X extends AnyType> extends Type<InferType<X>> {
  protected type: X | undefined;

  /**
   * Creates a new {@link LazyType} instance.
   *
   * @param async
   * @param provider Returns the type definition that must be applied to the input value.
   */
  constructor(async: boolean, private provider: () => X) {
    super(async);
  }

  at(key: unknown): AnyType | null {
    return (this.type ||= this.provider()).at(key);
  }

  parse(input: unknown, options?: ParserOptions): Awaitable<InferType<X>> {
    return (this.type ||= this.provider()).parse(input, options);
  }
}
