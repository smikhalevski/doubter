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

  _parse(value: unknown, context: ParserContext): any {
    if (!Array.isArray(value)) {
      context.raiseIssue(createIssue(context, 'type', value, 'array'));
      return value;
    }

    const valueLength = value.length;

    const { _elementTypes } = this;
    const elementsLength = _elementTypes.length;

    if (valueLength !== elementsLength) {
      context.raiseIssue(createIssue(context, 'tuple_length', value, elementsLength));

      if (context.aborted) {
        return value;
      }
    }

    if (this.isAsync()) {
      return Promise.all(
        _elementTypes.map((elementType, i) => elementType._parse(value[i], context.fork(false).enterKey(i)))
      );
    }

    const elements = [];

    for (let i = 0; i < elementsLength; ++i) {
      context.enterKey(i);
      elements[i] = _elementTypes[i]._parse(value[i], context);
      context.exitKey();

      if (context.aborted) {
        return value;
      }
    }
    return elements;
  }
}
