import { InferType, Type } from './Type';
import { isAsync } from '../utils';
import { ParserContext } from '../ParserContext';

export class UnionType<U extends [Type, ...Type[]]> extends Type<{ [K in keyof U]: InferType<U[K]> }[number]> {
  constructor(private _types: U) {
    super();
  }

  isAsync(): boolean {
    return isAsync(this._types);
  }

  _parse(value: unknown, context: ParserContext): any {
    const { _types } = this;

    if (this.isAsync()) {
    }

    let typeContext;

    for (const type of _types) {
      typeContext = context.fork(true);
      const result = type._parse(value, typeContext);

      if (typeContext.valid) {
        return result;
      }
    }
    if (typeContext !== undefined) {
      context.absorb(typeContext);
    }
    return value;
  }
}
