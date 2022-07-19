import { Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue, shallowClone } from '../utils';

export class StringType extends Type<string> {
  private _minLength?: number;
  private _maxLength?: number;
  private _re?: RegExp;

  min(length: number): StringType {
    const type = shallowClone(this);
    type._minLength = length;
    return type;
  }

  max(length: number): StringType {
    const type = shallowClone(this);
    type._maxLength = length;
    return type;
  }

  pattern(re: RegExp): StringType {
    const type = shallowClone(this);
    type._re = re;
    return type;
  }

  _parse(input: unknown, context: ParserContext): any {
    if (typeof input !== 'string') {
      context.raiseIssue(createIssue(context, 'type', input, 'string'));
      return input;
    }

    const { _minLength, _maxLength, _re } = this;
    const inputLength = input.length;

    if (_minLength !== undefined && inputLength <= _minLength) {
      context.raiseIssue(createIssue(context, 'string_min', input, _minLength));

      if (context.aborted) {
        return input;
      }
    }

    if (_maxLength !== undefined && inputLength >= _maxLength) {
      context.raiseIssue(createIssue(context, 'string_max', input, _minLength));

      if (context.aborted) {
        return input;
      }
    }

    if (_re !== undefined && !_re.test(input)) {
      context.raiseIssue(createIssue(context, 'string_pattern', input, _re));

      if (context.aborted) {
        return input;
      }
    }

    return input;
  }
}
