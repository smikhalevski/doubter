import { AnyType, InferType, Type } from './Type';
import { ParserContext } from '../ParserContext';

/**
 * The optional type definition.
 *
 * @template X The underlying type definition.
 */
export class OptionalType<X extends AnyType> extends Type<InferType<X> | undefined> {
  /**
   * Creates a new {@link OptionalType} instance.
   *
   * @param _type The underlying type definition.
   * @param _defaultValue The value that should be used if input is `undefined`.
   */
  constructor(private _type: X, private _defaultValue?: InferType<X>) {
    super();
  }

  isAsync(): boolean {
    return this._type.isAsync();
  }

  _parse(input: unknown, context: ParserContext): any {
    const { _type, _defaultValue } = this;

    if (input === undefined) {
      return this.isAsync() ? Promise.resolve(_defaultValue) : _defaultValue;
    } else {
      return _type._parse(input, context);
    }
  }
}
