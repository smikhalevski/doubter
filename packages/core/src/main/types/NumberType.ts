import { Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue } from '../utils';

export class NumberType extends Type<number> {
  private _min?: number;
  private _max?: number;
  private _inclusiveMin?: number;
  private _inclusiveMax?: number;
  private _divisor?: number;

  positive(): NumberType {
    return this.gt(0);
  }

  negative(): NumberType {
    return this.lt(0);
  }

  gt(value: number): NumberType {
    const type = this.clone();
    type._min = value;
    return type;
  }

  lt(value: number): NumberType {
    const type = this.clone();
    type._max = value;
    return type;
  }

  gte(value: number): NumberType {
    const type = this.clone();
    type._inclusiveMin = value;
    return type;
  }

  lte(value: number): NumberType {
    const type = this.clone();
    type._inclusiveMax = value;
    return type;
  }

  multipleOf(divisor: number): NumberType {
    const type = this.clone();
    type._divisor = divisor;
    return type;
  }

  _parse(value: unknown, context: ParserContext): any {
    if (typeof value !== 'number' || isNaN(value)) {
      context.raiseIssue(createIssue(context, 'type', value, 'number'));
      return value;
    }

    const { _min, _max, _inclusiveMin, _inclusiveMax, _divisor } = this;

    if (_min !== undefined && value < _min) {
      context.raiseIssue(createIssue(context, 'number_gt', value, _min));

      if (context.aborted) {
        return value;
      }
    }

    if (_max !== undefined && value > _max) {
      context.raiseIssue(createIssue(context, 'number_lt', value, _max));

      if (context.aborted) {
        return value;
      }
    }

    if (_inclusiveMin !== undefined && value <= _inclusiveMin) {
      context.raiseIssue(createIssue(context, 'number_gte', value, _inclusiveMin));

      if (context.aborted) {
        return value;
      }
    }

    if (_inclusiveMax !== undefined && value >= _inclusiveMax) {
      context.raiseIssue(createIssue(context, 'number_lte', value, _inclusiveMax));

      if (context.aborted) {
        return value;
      }
    }

    if (_divisor !== undefined && value % _divisor !== 0) {
      context.raiseIssue(createIssue(context, 'number_multiple_of', value, _divisor));

      if (context.aborted) {
        return value;
      }
    }

    return value;
  }
}
