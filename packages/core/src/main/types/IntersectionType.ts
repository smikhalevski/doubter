import { InferType, Type } from './Type';
import { Intersection } from '../shared-types';
import { isAsync } from '../utils';
import { ParserContext } from '../ParserContext';

export class IntersectionType<U extends [Type, ...Type[]]> extends Type<
  Intersection<{ [K in keyof U]: InferType<U[K]> }[number]>
> {
  constructor(private _types: U) {
    super();
  }

  isAsync(): boolean {
    return isAsync(this._types);
  }

  _parse(value: unknown, context: ParserContext): any {
    const { _types } = this;

    if (this.isAsync()) {
      let promise = Promise.resolve(value);

      for (const type of _types) {
        promise = promise.then(value => type._parse(value, context));
      }

      return promise;
    }

    let result = value;

    for (const type of _types) {
      result = type._parse(result, context);

      if (context.aborted) {
        return value;
      }
    }
    return result;
  }
}
