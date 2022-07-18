import { Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue, getValueType, IssueCode, ValueType } from '../utils';

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
    if (getValueType(value) !== ValueType.STRING) {
      context.raiseIssue(createIssue(context, IssueCode.INVALID_TYPE, value, ValueType.STRING));
      return value;
    }

    const valueLength = value.length;

    const { _minLength, _maxLength, _re } = this;

    if (_minLength !== undefined && valueLength < _minLength) {
      context.raiseIssue(createIssue(context, IssueCode.STRING_TOO_SHORT, value, _minLength));

      if (context.aborted) {
        return value;
      }
    }

    if (_maxLength !== undefined && valueLength > _maxLength) {
      context.raiseIssue(createIssue(context, IssueCode.STRING_TOO_LONG, value, _minLength));

      if (context.aborted) {
        return value;
      }
    }

    if (_re !== undefined && !_re.test(value)) {
      context.raiseIssue(createIssue(context, IssueCode.STRING_NO_MATCH, value, _re));

      if (context.aborted) {
        return value;
      }
    }

    return value;
  }
}
