import { Type } from './Type';
import { cloneObject, raiseIssue, raiseIssuesIfDefined, raiseIssuesOrPush } from '../utils';
import { ConstraintOptions, ParserOptions } from '../shared-types';

const isFinite = Number.isFinite;

/**
 * The number type definition.
 */
export class NumberType extends Type<number> {
  protected min?: number;
  protected max?: number;
  protected minIncluded?: boolean;
  protected maxIncluded?: boolean;
  protected divisor?: number;
  protected minOptions?: ConstraintOptions;
  protected maxOptions?: ConstraintOptions;
  protected divisorOptions?: ConstraintOptions;

  constructor(options?: ConstraintOptions) {
    super(false, options);
  }

  /**
   * Constrains the number to be greater than zero.
   */
  positive(options?: ConstraintOptions): this {
    return this.gt(0, options);
  }

  /**
   * Constrains the number to be less than zero.
   */
  negative(options?: ConstraintOptions): this {
    return this.lt(0, options);
  }

  /**
   * Constrains the number to be greater than the value.
   */
  gt(value: number, options?: ConstraintOptions): this {
    const type = cloneObject(this);
    type.min = value;
    type.minIncluded = false;
    type.minOptions = options;
    return type;
  }

  /**
   * Constrains the number to be less than the value.
   */
  lt(value: number, options?: ConstraintOptions): this {
    const type = cloneObject(this);
    type.max = value;
    type.maxIncluded = false;
    type.maxOptions = options;
    return type;
  }

  /**
   * Constrains the number to be greater than or equal to the value.
   */
  gte(value: number, options?: ConstraintOptions): this {
    const type = cloneObject(this);
    type.min = value;
    type.minIncluded = true;
    type.minOptions = options;
    return type;
  }

  /**
   * Constrains the number to be less than or equal to the value.
   */
  lte(value: number, options?: ConstraintOptions): this {
    const type = cloneObject(this);
    type.max = value;
    type.maxIncluded = true;
    type.maxOptions = options;
    return type;
  }

  /**
   * Constrains the number to be a multiple of the divisor.
   *
   * @param divisor The number by which the input should be divisible without a remainder.
   * @param options The constraint options.
   */
  multipleOf(divisor: number, options?: ConstraintOptions): this {
    const type = cloneObject(this);
    type.divisor = divisor;
    type.divisorOptions = options;
    return type;
  }

  parse(input: any, options?: ParserOptions): number {
    if (!isFinite(input)) {
      raiseIssue(input, 'type', 'number', this.options, 'Must be a number');
    }

    const { min, max, minIncluded, maxIncluded, divisor } = this;

    let issues;

    if (min != null && (minIncluded ? input < min : input <= min)) {
      issues = raiseIssuesOrPush(
        issues,
        options,
        input,
        minIncluded ? 'numberGreaterThanOrEqual' : 'numberGreaterThan',
        min,
        this.minOptions,
        'Must be greater than ' + (minIncluded ? 'or equal to ' + min : min)
      );
    }

    if (max != null && (maxIncluded ? input > max : input >= max)) {
      issues = raiseIssuesOrPush(
        issues,
        options,
        input,
        maxIncluded ? 'numberLessThanOrEqual' : 'numberLessThan',
        max,
        this.maxOptions,
        'Must be less than ' + (maxIncluded ? 'or equal to ' + max : max)
      );
    }

    if (divisor != null && input % divisor !== 0) {
      issues = raiseIssuesOrPush(
        issues,
        options,
        input,
        'numberMultipleOf',
        divisor,
        this.divisorOptions,
        'Must be a multiple of ' + divisor
      );
    }

    raiseIssuesIfDefined(issues);

    return input;
  }
}
