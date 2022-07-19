import { InferType, Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue, isAsync } from '../utils';

export class TupleType<U extends [Type, ...Type[]]> extends Type<{ [K in keyof U]: InferType<U[K]> }> {
  constructor(private _types: U) {
    super();
  }

  isAsync(): boolean {
    return isAsync(this._types);
  }

  _parse(input: unknown, context: ParserContext): any {
    if (!Array.isArray(input)) {
      context.raiseIssue(createIssue(context, 'type', input, 'array'));
      return input;
    }

    const { _types } = this;
    const typesLength = _types.length;
    const inputLength = input.length;

    if (inputLength !== typesLength) {
      context.raiseIssue(createIssue(context, 'tuple_length', input, typesLength));

      if (context.aborted) {
        return input;
      }
    }

    if (this.isAsync()) {
      return Promise.all(_types.map((elementType, i) => elementType._parse(input[i], context.fork(false).enterKey(i))));
    }

    const output = [];

    for (let i = 0; i < typesLength; ++i) {
      context.enterKey(i);
      output[i] = _types[i]._parse(input[i], context);
      context.exitKey();

      if (context.aborted) {
        return input;
      }
    }
    return output;
  }
}
