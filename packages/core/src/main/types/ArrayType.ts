import { Type } from './Type';
import { InferType } from '../shared-types';
import { ParserContext } from '../ParserContext';
import { createIssue, getValueType, IssueCode, ValueType } from '../utils';

export class ArrayType<X extends Type> extends Type<InferType<X>[]> {
  private _minLength?: number;
  private _maxLength?: number;

  constructor(private _elementType: X) {
    super();
  }

  min(length: number): ArrayType<X> {
    const type = this._clone();
    type._minLength = length;
    return type;
  }

  max(length: number): ArrayType<X> {
    const type = this._clone();
    type._maxLength = length;
    return type;
  }

  protected _isAsync(): boolean {
    return this._elementType.async;
  }

  _parse(value: any, context: ParserContext): any {
    if (getValueType(value) !== ValueType.ARRAY) {
      context.raiseIssue(createIssue(context, IssueCode.INVALID_TYPE, value, ValueType.ARRAY));
      return value;
    }

    const arr: any[] = value;
    const arrLength = arr.length;

    const { _minLength, _maxLength, _elementType } = this;

    if (_minLength !== undefined && arrLength < _minLength) {
      context.raiseIssue(createIssue(context, IssueCode.ARRAY_TOO_SHORT, value, _minLength));

      if (context.aborted) {
        return value;
      }
    }

    if (_maxLength !== undefined && arrLength > _maxLength) {
      context.raiseIssue(createIssue(context, IssueCode.ARRAY_TOO_LONG, value, _maxLength));

      if (context.aborted) {
        return value;
      }
    }

    if (this.async) {
      return Promise.all(arr.map((element, i) => _elementType._parse(element, context.fork(false).enterKey(i))));
    }

    const elements = [];

    for (let i = 0; i < arrLength; ++i) {
      context.enterKey(i);
      elements[i] = _elementType._parse(arr[i], context);
      context.exitKey();

      if (context.aborted) {
        return value;
      }
    }
    return elements;
  }
}
