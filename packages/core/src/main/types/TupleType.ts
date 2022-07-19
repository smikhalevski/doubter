import { InferType, Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue, isAsync } from '../utils';

export class TupleType<U extends [Type, ...Type[]]> extends Type<{ [K in keyof U]: InferType<U[K]> }> {
  constructor(private _elementTypes: U) {
    super();
  }

  isAsync(): boolean {
    return isAsync(this._elementTypes);
  }

  _parse(input: unknown, context: ParserContext): any {
    if (!Array.isArray(input)) {
      context.raiseIssue(createIssue(context, 'type', input, 'array'));
      return input;
    }

    const valueLength = input.length;

    const { _elementTypes } = this;
    const elementsLength = _elementTypes.length;

    if (valueLength !== elementsLength) {
      context.raiseIssue(createIssue(context, 'tuple_length', input, elementsLength));

      if (context.aborted) {
        return input;
      }
    }

    if (this.isAsync()) {
      return Promise.all(
        _elementTypes.map((elementType, i) => elementType._parse(input[i], context.fork(false).enterKey(i)))
      );
    }

    const elements = [];

    for (let i = 0; i < elementsLength; ++i) {
      context.enterKey(i);
      elements[i] = _elementTypes[i]._parse(input[i], context);
      context.exitKey();

      if (context.aborted) {
        return input;
      }
    }
    return elements;
  }
}
