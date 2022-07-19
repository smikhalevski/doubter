import { InferType, Type } from './Type';
import { ParserContext } from '../ParserContext';

export class LazyType<X extends Type> extends Type<InferType<X>> {
  constructor(private _typeProvider: () => X) {
    super();
  }

  isAsync(): boolean {
    return this._typeProvider().isAsync();
  }

  _parse(value: unknown, context: ParserContext): any {
    return this._typeProvider()._parse(value, context);
  }
}
