import { Type } from './Type';
import { ParserContext } from '../ParserContext';

export class NullableType<T> extends Type<T | null> {
  constructor(private _type: Type<T>) {
    super();
  }

  isAsync() {
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
