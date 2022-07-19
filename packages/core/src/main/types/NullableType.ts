import { Type } from './Type';
import { ParserContext } from '../ParserContext';

export class NullableType<T> extends Type<T | null> {
  constructor(private _type: Type<T>) {
    super();
  }

  isAsync() {
    return this._type.isAsync();
  }

  _parse(value: unknown, context: ParserContext): any {
    const { _type } = this;

    if (value === null) {
      return this.isAsync() ? Promise.resolve(value) : value;
    } else {
      return _type._parse(value, context);
    }
  }
}
