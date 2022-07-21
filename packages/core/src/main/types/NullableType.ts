import { AnyType, InferType, Type } from './Type';
import { ParserContext } from '../ParserContext';

/**
 * The nullable type definition.
 *
 * @template X The underlying type definition.
 */
export class NullableType<X extends AnyType> extends Type<InferType<X> | null> {
  /**
   * Creates a new {@link NullableType} instance.
   *
   * @param _type The underlying type definition.
   */
  constructor(private _type: X) {
    super();
  }

  isAsync(): boolean {
    return this._type.isAsync();
  }

  _parse(input: unknown, context: ParserContext): any {
    const { _type } = this;

    if (input === null) {
      return this.isAsync() ? Promise.resolve(input) : input;
    } else {
      return _type._parse(input, context);
    }
  }
}
