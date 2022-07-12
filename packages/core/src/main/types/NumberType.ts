import { Type } from './Type';
import { ParserContext } from '../ParserContext';
import { getValueType, IssueCode, ValueType } from '../utils';
import { createInvalidTypeIssue, createTooBigIssue, createTooSmallIssue, NotMultipleOfIssue } from '../issue-utils';

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
    const receivedType = getValueType(value);

    if (receivedType !== expectedType) {
      context.raiseIssue(createInvalidTypeIssue(context, value, expectedType, receivedType));
      return value;
    }

    const { _min, _max, _inclusiveMin, _inclusiveMax, _divisor } = this;

    if (_min !== undefined && value < _min) {
      context.raiseIssue(createTooSmallIssue(context, receivedType, value, value, _min, false));

      if (context.aborted) {
        return value;
      }
    }

    if (_max !== undefined && value > _max) {
      context.raiseIssue(createTooBigIssue(context, receivedType, value, value, _max, false));

      if (context.aborted) {
        return value;
      }
    }

    if (_inclusiveMin !== undefined && value <= _inclusiveMin) {
      context.raiseIssue(createTooSmallIssue(context, receivedType, value, value, _inclusiveMin));

      if (context.aborted) {
        return value;
      }
    }

    if (_inclusiveMax !== undefined && value >= _inclusiveMax) {
      context.raiseIssue(createTooBigIssue(context, receivedType, value, value, _inclusiveMax));

      if (context.aborted) {
        return value;
      }
    }

    if (_divisor !== undefined && value % _divisor !== 0) {
      context.raiseIssue<NotMultipleOfIssue>({
        code: IssueCode.NOT_MULTIPLE_OF,
        path: context.getPath(),
        value,
        divisor: _divisor,
      });

      if (context.aborted) {
        return value;
      }
    }

    return value;
  }
}
