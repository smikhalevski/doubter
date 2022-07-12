import { Type } from './Type';
import { ParserContext } from '../ParserContext';
import { getValueType, IssueCode, ValueType } from '../utils';
import { createInvalidTypeIssue, createTooBigIssue, createTooSmallIssue, NotMatchingIssue } from '../issue-utils';

export class StringType extends Type<string> {
  private _minLength?: number;
  private _maxLength?: number;
  private _re?: RegExp;

  min(length: number): StringType {
    const type = this._clone();
    type._minLength = length;
    return type;
  }

  max(length: number): StringType {
    const type = this._clone();
    type._maxLength = length;
    return type;
  }

  matches(re: RegExp): StringType {
    const type = this._clone();
    type._re = re;
    return type;
  }

  _parse(value: any, context: ParserContext): any {
    const receivedType = getValueType(value);

    if (receivedType !== ValueType.STRING) {
      context.raiseIssue(createInvalidTypeIssue(context, value, ValueType.STRING, receivedType));
      return value;
    }

    const valueLength = value.length;

    const { _minLength, _maxLength, _re } = this;

    if (_minLength !== undefined && valueLength < _minLength) {
      context.raiseIssue(createTooSmallIssue(context, receivedType, value, value, _minLength));
    }

    if (_maxLength !== undefined && valueLength > _maxLength) {
      context.raiseIssue(createTooBigIssue(context, receivedType, value, value, _maxLength));
    }

    if (_re !== undefined && !_re.test(value)) {
      return context.raiseIssue<NotMatchingIssue>({
        code: IssueCode.NOT_MATCHING,
        path: context.getPath(),
        value,
        re: _re,
      });
    }

    return value;
  }
}
