import { Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue } from '../utils';

export class NumberType extends Type<number> {
  private _min?: number;
  private _max?: number;
  private _minIncluded?: boolean;
  private _maxIncluded?: boolean;
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
    type._minIncluded = false;
    return type;
  }

  lt(value: number): NumberType {
    const type = this.clone();
    type._max = value;
    type._maxIncluded = false;
    return type;
  }

  gte(value: number): NumberType {
    const type = this.clone();
    type._min = value;
    type._minIncluded = true;
    return type;
  }

  lte(value: number): NumberType {
    const type = this.clone();
    type._max = value;
    type._maxIncluded = true;
    return type;
  }

  multipleOf(divisor: number): NumberType {
    const type = this.clone();
    type._divisor = divisor;
    return type;
  }

  _parse(input: unknown, context: ParserContext): any {
    if (typeof input !== 'number' || isNaN(input)) {
      context.raiseIssue(createIssue(context, 'type', input, 'number'));
      return input;
    }

    const { _min, _max, _minIncluded, _maxIncluded, _divisor } = this;

    if (_min !== undefined && (_minIncluded ? input <= _min : input < _min)) {
      context.raiseIssue(createIssue(context, _minIncluded ? 'number_gte' : 'number_gt', input, _min));

      if (context.aborted) {
        return input;
      }
    }

    if (_max !== undefined && (_maxIncluded ? input >= _max : input > _max)) {
      context.raiseIssue(createIssue(context, _maxIncluded ? 'number_lte' : 'number_lt', input, _max));

      if (context.aborted) {
        return input;
      }
    }

    if (_divisor !== undefined && input % _divisor !== 0) {
      context.raiseIssue(createIssue(context, 'number_multiple_of', input, _divisor));

      if (context.aborted) {
        return input;
      }
    }

    return input;
  }
}
