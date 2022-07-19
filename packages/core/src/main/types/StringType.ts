import { Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue } from '../utils';

export class StringType extends Type<string> {
  private _minLength?: number;
  private _maxLength?: number;
  private _re?: RegExp;

  min(length: number): StringType {
    const type = this.clone();
    type._minLength = length;
    return type;
  }

  max(length: number): StringType {
    const type = this.clone();
    type._maxLength = length;
    return type;
  }

  pattern(re: RegExp): StringType {
    const type = this.clone();
    type._re = re;
    return type;
  }

  _parse(value: unknown, context: ParserContext): any {
    if (typeof value !== 'string') {
      context.raiseIssue(createIssue(context, 'type', value, 'string'));
      return value;
    }

    const valueLength = value.length;

    const { _minLength, _maxLength, _re } = this;

    if (_minLength !== undefined && valueLength < _minLength) {
      context.raiseIssue(createIssue(context, 'string_min', value, _minLength));

      if (context.aborted) {
        return value;
      }
    }

    if (_maxLength !== undefined && valueLength > _maxLength) {
      context.raiseIssue(createIssue(context, 'string_max', value, _minLength));

      if (context.aborted) {
        return value;
      }
    }

    if (_re !== undefined && !_re.test(value)) {
      context.raiseIssue(createIssue(context, 'string_pattern', value, _re));

      if (context.aborted) {
        return value;
      }
    }

    return value;
  }
}
