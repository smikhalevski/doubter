import { Type } from './Type';
import { InferType, UnionToIntersection } from '../shared-types';
import { isAsync } from '../utils';
import { ParserContext } from '../ParserContext';

export class IntersectionType<U extends [Type, ...Type[]]> extends Type<
  UnionToIntersection<{ [K in keyof U]: InferType<U[K]> }[number]>
> {
  constructor(private _types: U) {
    super();
  }

  protected _isAsync(): boolean {
    return isAsync(this._types);
  }

  _parse(value: any, context: ParserContext): any {
    const { _types } = this;

    if (this.async) {
      return Promise.all(_types.map(type => type._parse(value, context)));
    }

    for (const type of _types) {
      type._parse(value, context);

      if (context.aborted) {
        return value;
      }
    }
    return value;
  }
}
