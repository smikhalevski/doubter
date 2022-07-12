import { Type } from './Type';
import { InferType } from '../shared-types';
import { ParserContext } from '../ParserContext';
import { getValueType, ValueType } from '../utils';
import { createInvalidTypeIssue, createTooBigIssue, createTooSmallIssue } from '../issue-utils';

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
    const receivedType = getValueType(value);

    if (receivedType !== ValueType.ARRAY) {
      context.raiseIssue(createInvalidTypeIssue(context, value, ValueType.ARRAY, receivedType));
      return value;
    }

    const arr: any[] = value;
    const arrLength = arr.length;

    const { _minLength, _maxLength, _elementType } = this;

    if (_minLength !== undefined && arrLength < _minLength) {
      context.raiseIssue(createTooSmallIssue(context, receivedType, value, _minLength, arrLength));

      if (context.aborted) {
        return value;
      }
    }

    if (_maxLength !== undefined && arrLength > _maxLength) {
      context.raiseIssue(createTooBigIssue(context, receivedType, value, _maxLength, arrLength));

      if (context.aborted) {
        return value;
      }
    }

    if (this.async) {
      return Promise.all(arr.map((element, i) => _elementType._parse(element, context.fork().enterKey(i))));
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
