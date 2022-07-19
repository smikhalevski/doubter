import { InferType, Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue } from '../utils';

export class ArrayType<X extends Type = Type> extends Type<InferType<X>[]> {
  private _minLength?: number;
  private _maxLength?: number;

  constructor(private _elementType?: X) {
    super();
  }

  min(length: number): this {
    const type = this.clone();
    type._minLength = length;
    return type;
  }

  max(length: number): this {
    const type = this.clone();
    type._maxLength = length;
    return type;
  }

  isAsync(): boolean {
    const { _elementType } = this;

    return _elementType !== undefined && _elementType.isAsync();
  }

  _parse(value: unknown, context: ParserContext): any {
    if (!Array.isArray(value)) {
      context.raiseIssue(createIssue(context, 'type', value, 'array'));
      return value;
    }

    const valueLength = value.length;

    const { _minLength, _maxLength, _elementType } = this;

    if (_minLength !== undefined && valueLength < _minLength) {
      context.raiseIssue(createIssue(context, 'array_min', value, _minLength));

      if (context.aborted) {
        return value;
      }
    }

    if (_maxLength !== undefined && valueLength > _maxLength) {
      context.raiseIssue(createIssue(context, 'array_max', value, _maxLength));

      if (context.aborted) {
        return value;
      }
    }

    if (_elementType === undefined) {
      return value;
    }

    if (this.isAsync()) {
      return Promise.all(value.map((element, i) => _elementType._parse(element, context.fork(false).enterKey(i))));
    }

    const elements = [];

    for (let i = 0; i < valueLength; ++i) {
      context.enterKey(i);
      elements[i] = _elementType._parse(value[i], context);
      context.exitKey();

      if (context.aborted) {
        return value;
      }
    }
    return elements;
  }
}
