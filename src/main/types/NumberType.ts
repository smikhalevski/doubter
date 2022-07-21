import { Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue, shallowClone } from '../utils';

/**
 * The number type definition.
 */
export class NumberType extends Type<number> {
  private _min?: number;
  private _max?: number;
  private _minIncluded?: boolean;
  private _maxIncluded?: boolean;
  private _divisor?: number;

  /**
   * Constrains the number to be greater than zero.
   */
  positive(): this {
    return this.gt(0);
  }

  /**
   * Constrains the number to be less than zero.
   */
  negative(): this {
    return this.lt(0);
  }

  /**
   * Constrains the number to be greater than the value.
   */
  gt(value: number): this {
    const type = shallowClone(this);
    type._min = value;
    type._minIncluded = false;
    return type;
  }

  /**
   * Constrains the number to be less than the value.
   */
  lt(value: number): this {
    const type = shallowClone(this);
    type._max = value;
    type._maxIncluded = false;
    return type;
  }

  /**
   * Constrains the number to be greater than or equal to the value.
   */
  gte(value: number): this {
    const type = shallowClone(this);
    type._min = value;
    type._minIncluded = true;
    return type;
  }

  /**
   * Constrains the number to be less than or equal to the value.
   */
  lte(value: number): this {
    const type = shallowClone(this);
    type._max = value;
    type._maxIncluded = true;
    return type;
  }

  /**
   * Constrains the number to be a multiple of the divisor.
   *
   * @param divisor The number by which the input should be divisible without a remainder.
   */
  multipleOf(divisor: number): this {
    const type = shallowClone(this);
    type._divisor = divisor;
    return type;
  }

  _parse(input: unknown, context: ParserContext): any {
    if (typeof input !== 'number' || isNaN(input)) {
      context.raiseIssue(createIssue(context, 'type', input, 'number'));
      return input;
    }

    const { _min, _max, _minIncluded, _maxIncluded, _divisor } = this;

    if (_min !== undefined && (_minIncluded ? input < _min : input <= _min)) {
      context.raiseIssue(
        createIssue(context, _minIncluded ? 'numberGreaterThanOrEqual' : 'numberGreaterThan', input, _min)
      );

      if (context.aborted) {
        return input;
      }
    }

    if (_max !== undefined && (_maxIncluded ? input > _max : input >= _max)) {
      context.raiseIssue(createIssue(context, _maxIncluded ? 'numberLessThanOrEqual' : 'numberLessThan', input, _max));

      if (context.aborted) {
        return input;
      }
    }

    if (_divisor !== undefined && input % _divisor !== 0) {
      context.raiseIssue(createIssue(context, 'numberMultipleOf', input, _divisor));
    }

    return input;
  }
}
