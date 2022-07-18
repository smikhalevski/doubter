import { Type } from './Type';
import { InferType } from '../shared-types';
import { ParserContext } from '../ParserContext';
import { createIssue, getValueType, isAsync, IssueCode, ValueType } from '../utils';

export class TupleType<U extends [Type, ...Type[]]> extends Type<{ [K in keyof U]: InferType<U[K]> }> {
  constructor(private _elementTypes: U) {
    super();
  }

  protected _isAsync(): boolean {
    return isAsync(this._elementTypes);
  }

  _parse(value: any, context: ParserContext): any {
    if (getValueType(value) !== ValueType.ARRAY) {
      context.raiseIssue(createIssue(context, IssueCode.INVALID_TYPE, value, ValueType.ARRAY));
      return value;
    }

    const arr: any[] = value;
    const arrLength = arr.length;

    const { _elementTypes } = this;
    const elementsLength = _elementTypes.length;

    if (arrLength !== elementsLength) {
      context.raiseIssue(createIssue(context, IssueCode.TUPLE_INVALID_LENGTH, value, elementsLength));

      if (context.aborted) {
        return value;
      }
    }

    if (this.async) {
      return Promise.all(
        _elementTypes.map((elementType, i) => elementType._parse(arr[i], context.fork(false).enterKey(i)))
      );
    }

    const elements = [];

    for (let i = 0; i < elementsLength; ++i) {
      context.enterKey(i);
      elements[i] = _elementTypes[i]._parse(arr[i], context);
      context.exitKey();

      if (context.aborted) {
        return value;
      }
    }
    return elements;
  }
}
