import { AnyType, InferType, Type } from './Type';
import { ParserContext } from '../ParserContext';

/**
 * The lazily-evaluated type definition.
 *
 * @template X The type definition returned by the provider.
 */
export class LazyType<X extends AnyType> extends Type<InferType<X>> {
  /**
   * Creates a new {@link LazyType} instance.
   *
   * @param _typeProvider Returns the type definition that must be applied to the input value.
   */
  constructor(private _typeProvider: () => X) {
    super();
  }

  isAsync(): boolean {
    return this._typeProvider().isAsync();
  }

  _parse(input: unknown, context: ParserContext): any {
    return this._typeProvider()._parse(input, context);
  }
}
