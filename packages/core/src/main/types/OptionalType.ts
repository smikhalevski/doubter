import { Type } from './Type';
import { ParserContext } from '../ParserContext';

export class OptionalType<T> extends Type<T | undefined> {
  constructor(private _type: Type<T>, private _defaultValue?: T) {
    super();
  }

  isAsync() {
    return this._type.isAsync();
  }

  _parse(value: unknown, context: ParserContext): any {
    const { _type, _defaultValue } = this;

    if (value === undefined) {
      return this.isAsync() ? Promise.resolve(_defaultValue) : _defaultValue;
    } else {
      return _type._parse(value, context);
    }
  }
}
