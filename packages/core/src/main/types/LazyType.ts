import { Type } from './Type';
import { InferType } from '../shared-types';
import { ParserContext } from '../ParserContext';

export class LazyType<X extends Type> extends Type<InferType<X>> {
  constructor(private _typeProvider: () => X) {
    super();
  }

  protected _isAsync(): boolean {
    return this._typeProvider().async;
  }

  _parse(value: any, context: ParserContext): any {
    return this._typeProvider()._parse(value, context);
  }
}
