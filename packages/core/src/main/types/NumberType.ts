import { Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue, getValueType, IssueCode, ValueType } from '../utils';

export class NumberType extends Type<number> {
  private _integer?: boolean;
  private _min?: number;
  private _max?: number;
  private _inclusiveMin?: number;
  private _inclusiveMax?: number;
  private _divisor?: number;

  int(): NumberType {
    const type = this._clone();
    type._integer = true;
    return type;
  }

  positive(): NumberType {
    return this.gt(0);
  }

  negative(): NumberType {
    return this.lt(0);
  }

  gt(value: number): NumberType {
    const type = this._clone();
    type._min = value;
    return type;
  }

  lt(value: number): NumberType {
    const type = this._clone();
    type._max = value;
    return type;
  }

  gte(value: number): NumberType {
    const type = this._clone();
    type._inclusiveMin = value;
    return type;
  }

  lte(value: number): NumberType {
    const type = this._clone();
    type._inclusiveMax = value;
    return type;
  }

  multipleOf(divisor: number): NumberType {
    const type = this._clone();
    type._divisor = divisor;
    return type;
  }

  _parse(value: any, context: ParserContext): any {
    const expectedType = this._integer ? ValueType.INTEGER : ValueType.NUMBER;

    if (getValueType(value) !== expectedType) {
      context.raiseIssue(createIssue(context, IssueCode.INVALID_TYPE, value, expectedType));
      return value;
    }

    const { _min, _max, _inclusiveMin, _inclusiveMax, _divisor } = this;

    if (_min !== undefined && value < _min) {
      context.raiseIssue(createIssue(context, IssueCode.NUMBER_TOO_SMALL, value, _min));

      if (context.aborted) {
        return value;
      }
    }

    if (_max !== undefined && value > _max) {
      context.raiseIssue(createIssue(context, IssueCode.NUMBER_TOO_BIG, value, _max));

      if (context.aborted) {
        return value;
      }
    }

    if (_inclusiveMin !== undefined && value <= _inclusiveMin) {
      context.raiseIssue(createIssue(context, IssueCode.NUMBER_TOO_SMALL_INCLUSIVE, value, _inclusiveMin));

      if (context.aborted) {
        return value;
      }
    }

    if (_inclusiveMax !== undefined && value >= _inclusiveMax) {
      context.raiseIssue(createIssue(context, IssueCode.NUMBER_TOO_BIG_INCLUSIVE, value, _inclusiveMax));

      if (context.aborted) {
        return value;
      }
    }

    if (_divisor !== undefined && value % _divisor !== 0) {
      context.raiseIssue(createIssue(context, IssueCode.NUMBER_NOT_MULTIPLE_OF, value, _divisor));

      if (context.aborted) {
        return value;
      }
    }

    return value;
  }
}
