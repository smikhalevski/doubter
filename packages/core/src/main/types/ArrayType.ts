import { InferType, Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue } from '../utils';

export class ArrayType<X extends Type = Type> extends Type<InferType<X>[]> {
  private _minLength?: number;
  private _maxLength?: number;

  constructor(private _type?: X) {
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
    const { _type } = this;

    return _type !== undefined && _type.isAsync();
  }

  _parse(input: unknown, context: ParserContext): any {
    if (!Array.isArray(input)) {
      context.raiseIssue(createIssue(context, 'type', input, 'array'));
      return input;
    }

    const inputLength = input.length;

    const { _minLength, _maxLength, _type } = this;

    if (_minLength !== undefined && inputLength < _minLength) {
      context.raiseIssue(createIssue(context, 'array_min', input, _minLength));

      if (context.aborted) {
        return input;
      }
    }

    if (_maxLength !== undefined && inputLength > _maxLength) {
      context.raiseIssue(createIssue(context, 'array_max', input, _maxLength));

      if (context.aborted) {
        return input;
      }
    }

    if (_type === undefined) {
      return input;
    }

    if (this.isAsync()) {
      return Promise.all(input.map((element, i) => _type._parse(element, context.fork(false).enterKey(i))));
    }

    const output = [];

    for (let i = 0; i < inputLength; ++i) {
      context.enterKey(i);
      output[i] = _type._parse(input[i], context);
      context.exitKey();

      if (context.aborted) {
        return input;
      }
    }
    return output;
  }
}
