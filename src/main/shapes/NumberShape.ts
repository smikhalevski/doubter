import { Result, Shape, ValueType } from './Shape';
import { ConstraintOptions, Message, ParseOptions } from '../shared-types';
import { addConstraint, cloneObject, createIssueFactory, isArray, isNumber, ok } from '../utils';
import {
  CODE_NUMBER_FINITE,
  CODE_NUMBER_GT,
  CODE_NUMBER_GTE,
  CODE_NUMBER_INTEGER,
  CODE_NUMBER_LT,
  CODE_NUMBER_LTE,
  CODE_NUMBER_MULTIPLE_OF,
  CODE_TYPE,
  MESSAGE_NUMBER_FINITE,
  MESSAGE_NUMBER_GT,
  MESSAGE_NUMBER_GTE,
  MESSAGE_NUMBER_INTEGER,
  MESSAGE_NUMBER_LT,
  MESSAGE_NUMBER_LTE,
  MESSAGE_NUMBER_MULTIPLE_OF,
  MESSAGE_NUMBER_TYPE,
  TYPE_ARRAY,
  TYPE_BOOLEAN,
  TYPE_DATE,
  TYPE_NULL,
  TYPE_NUMBER,
  TYPE_STRING,
  TYPE_UNDEFINED,
} from '../constants';
import { CoercibleShape } from './CoercibleShape';

/**
 * The shape that constrains the input as a number.
 */
export class NumberShape extends CoercibleShape<number> {
  protected _typeIssueFactory;
  protected _typePredicate = isNumber;

  /**
   * Creates a new {@linkcode NumberShape} instance.
   *
   * @param options The type constraint options or the type issue message.
   */
  constructor(options?: ConstraintOptions | Message) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_NUMBER_TYPE, options, TYPE_NUMBER);
  }

  /**
   * `true` if the shape constrains a finite number, or `false` otherwise.
   */
  get isFinite(): boolean {
    return this._typePredicate === Number.isFinite || this.isInteger;
  }

  /**
   * `true` if the shape constrains an integer number, or `false` otherwise.
   */
  get isInteger(): boolean {
    return this._typePredicate === Number.isInteger;
  }

  /**
   * Constrains the number to be greater than zero.
   *
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  positive(options?: ConstraintOptions | Message): this {
    return this.gt(0, options);
  }

  /**
   * Constrains the number to be less than zero.
   *
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  negative(options?: ConstraintOptions | Message): this {
    return this.lt(0, options);
  }

  /**
   * Constrains the number to be less or equal to zero.
   *
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  nonPositive(options?: ConstraintOptions | Message): this {
    return this.lte(0, options);
  }

  /**
   * Constrains the number to be greater or equal to zero.
   *
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  nonNegative(options?: ConstraintOptions | Message): this {
    return this.gte(0, options);
  }

  /**
   * Constrains the number to be greater than the value.
   *
   * @param value The exclusive minimum value.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  gt(value: number, options?: ConstraintOptions | Message): this {
    const issueFactory = createIssueFactory(CODE_NUMBER_GT, MESSAGE_NUMBER_GT, options, value);

    return addConstraint(this, CODE_NUMBER_GT, value, (input, options) => {
      if (input <= value) {
        return issueFactory(input, options);
      }
    });
  }

  /**
   * Constrains the number to be less than the value.
   *
   * @param value The exclusive maximum value.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  lt(value: number, options?: ConstraintOptions | Message): this {
    const issueFactory = createIssueFactory(CODE_NUMBER_LT, MESSAGE_NUMBER_LT, options, value);

    return addConstraint(this, CODE_NUMBER_LT, value, (input, options) => {
      if (input >= value) {
        return issueFactory(input, options);
      }
    });
  }

  /**
   * Constrains the number to be greater than or equal to the value.
   *
   * @param value The inclusive minimum value.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  gte(value: number, options?: ConstraintOptions | Message): this {
    const issueFactory = createIssueFactory(CODE_NUMBER_GTE, MESSAGE_NUMBER_GTE, options, value);

    return addConstraint(this, CODE_NUMBER_GTE, value, (input, options) => {
      if (input < value) {
        return issueFactory(input, options);
      }
    });
  }

  /**
   * Constrains the number to be less than or equal to the value.
   *
   * @param value The inclusive maximum value.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  lte(value: number, options?: ConstraintOptions | Message): this {
    const issueFactory = createIssueFactory(CODE_NUMBER_LTE, MESSAGE_NUMBER_LTE, options, value);

    return addConstraint(this, CODE_NUMBER_LTE, value, (input, options) => {
      if (input > value) {
        return issueFactory(input, options);
      }
    });
  }

  /**
   * Constrains the number to be a multiple of the divisor.
   *
   * @param value The positive number by which the input should be divisible without a remainder.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  multipleOf(value: number, options?: ConstraintOptions | Message): this {
    const issueFactory = createIssueFactory(CODE_NUMBER_MULTIPLE_OF, MESSAGE_NUMBER_MULTIPLE_OF, options, value);

    return addConstraint(this, CODE_NUMBER_MULTIPLE_OF, value, (input, options) => {
      if (!isMultipleOf(input, value)) {
        return issueFactory(input, options);
      }
    });
  }

  /**
   * Constrains the number to be a finite number.
   *
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  finite(options?: ConstraintOptions | Message): this {
    const shape = cloneObject(this);

    shape._typeIssueFactory = createIssueFactory(CODE_NUMBER_FINITE, MESSAGE_NUMBER_FINITE, options, undefined);
    shape._typePredicate = Number.isFinite;

    return shape;
  }

  /**
   * Constrains the number to be an integer.
   *
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  integer(options?: ConstraintOptions | Message): this {
    const shape = cloneObject(this);

    shape._typeIssueFactory = createIssueFactory(CODE_NUMBER_INTEGER, MESSAGE_NUMBER_INTEGER, options, undefined);
    shape._typePredicate = Number.isInteger;

    return shape;
  }

  /**
   * Allows `NaN` as an input and output value, or replaces an input `NaN` value with a default output value.
   *
   * @param [defaultValue = NaN] The value that is used instead of `NaN` in the output.
   */
  nan(defaultValue = NaN): Shape<number> {
    return this.replace(NaN, defaultValue);
  }

  protected _getInputTypes(): readonly ValueType[] {
    if (this.isCoerced) {
      return [TYPE_NUMBER, TYPE_STRING, TYPE_BOOLEAN, TYPE_ARRAY, TYPE_DATE, TYPE_UNDEFINED, TYPE_NULL];
    } else {
      return [TYPE_NUMBER];
    }
  }

  protected _apply(input: any, options: ParseOptions): Result<number> {
    const { _applyChecks } = this;

    let output = input;
    let issues = null;
    let changed = false;

    if (
      !this._typePredicate(output) &&
      (!(changed = options.coerced || this.isCoerced) || (output = this._coerce(input)) === null)
    ) {
      return this._typeIssueFactory(input, options);
    }
    if ((_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) && changed) {
      return ok(output);
    }
    return issues;
  }

  /**
   * Coerces value to a number (not `NaN`) or returns `null` if coercion isn't possible.
   *
   * @param value The non-number value to coerce.
   */
  protected _coerce(value: any): number | null {
    if (isArray(value) && value.length === 1 && typeof (value = value[0]) === 'number' && value === value) {
      return value;
    }
    if (value === null || value === undefined) {
      return 0;
    }
    if (
      (typeof value === 'string' || typeof value === 'boolean' || value instanceof Date) &&
      this._typePredicate((value = +value))
    ) {
      return value;
    }
    return null;
  }
}

export interface NumberShape {
  /**
   * Constrains the number to be greater than or equal to the value.
   *
   * Alias for {@linkcode gte}.
   *
   * @param value The inclusive minimum value.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  min(value: number, options?: ConstraintOptions | Message): this;

  /**
   * Constrains the number to be less than or equal to the value.
   *
   * Alias for {@linkcode lte}.
   *
   * @param value The inclusive maximum value.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  max(value: number, options?: ConstraintOptions | Message): this;
}

NumberShape.prototype.min = NumberShape.prototype.gte;

NumberShape.prototype.max = NumberShape.prototype.lte;

const { abs, floor, max } = Math;

/**
 * Checks that `a` is divisible without a remainder by `b`.
 */
export function isMultipleOf(a: number, b: number): boolean {
  if (b <= 0 || a !== a || b !== b || a === Infinity || a === -Infinity || b === Infinity) {
    return false;
  }
  if (a === b || a % b === 0) {
    return true;
  }
  if (abs(a) < b || a === floor(a) || b === floor(b)) {
    // Integers had their chance
    return false;
  }

  const aStr = a.toString();
  const bStr = b.toString();

  const aExpIndex = aStr.indexOf('e');
  const bExpIndex = bStr.indexOf('e');

  const aDotIndex = aStr.indexOf('.');
  const bDotIndex = bStr.indexOf('.');

  // The exponent extracted from e+XXX plus the number of decimal digits
  const aDecLength =
    (~aExpIndex && abs(+aStr.substring(aExpIndex + 1))) + (~aDotIndex && ~(~aExpIndex || ~aStr.length) + ~aDotIndex);

  const bDecLength =
    (~bExpIndex && abs(+bStr.substring(bExpIndex + 1))) + (~bDotIndex && ~(~bExpIndex || ~bStr.length) + ~bDotIndex);

  const decLength = max(aDecLength, bDecLength);

  // Undefined behaviour if long overflow occurs
  const aLong = +a.toFixed(decLength).replace('.', '');
  const bLong = +b.toFixed(decLength).replace('.', '');

  return aLong % bLong === 0;
}
