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
} from '../constants';
import { ApplyOptions, ConstraintOptions, Literal, Message } from '../types';
import {
  addCheck,
  ARRAY,
  BOOLEAN,
  canonize,
  cloneInstance,
  createIssueFactory,
  DATE,
  isArray,
  isNumber,
  NULL,
  NUMBER,
  OBJECT,
  ok,
  STRING,
  UNDEFINED
} from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { AllowLiteralShape, NEVER, ReplaceLiteralShape, Result } from './Shape';

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

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_NUMBER_TYPE, options, NUMBER);
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

    return addCheck(this, CODE_NUMBER_GT, value, (input, param, options) => {
      if (input <= param) {
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

    return addCheck(this, CODE_NUMBER_LT, value, (input, param, options) => {
      if (input >= param) {
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

    return addCheck(this, CODE_NUMBER_GTE, value, (input, param, options) => {
      if (input < param) {
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

    return addCheck(this, CODE_NUMBER_LTE, value, (input, param, options) => {
      if (input > param) {
        return issueFactory(input, options);
      }
    });
  }

  /**
   * Constrains the number to be a multiple of the divisor.
   *
   * This constraint uses the
   * [modulo operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder) which may
   * produce unexpected results when used with floating point numbers. This happens because of
   * [the way numbers are represented by IEEE 754](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html).
   *
   * Use a custom check to constrain input to be a multiple of a real number.
   *
   * @param value The positive number by which the input should be divisible without a remainder.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  multipleOf(value: number, options?: ConstraintOptions | Message): this {
    const issueFactory = createIssueFactory(CODE_NUMBER_MULTIPLE_OF, MESSAGE_NUMBER_MULTIPLE_OF, options, value);

    return addCheck(this, CODE_NUMBER_MULTIPLE_OF, value, (input, param, options) => {
      if (input % param !== 0) {
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
    const shape = cloneInstance(this);

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
    const shape = cloneInstance(this);

    shape._typeIssueFactory = createIssueFactory(CODE_NUMBER_INTEGER, MESSAGE_NUMBER_INTEGER, options, undefined);
    shape._typePredicate = Number.isInteger;

    return shape;
  }

  /**
   * Allows `NaN` as an input and output value.
   */
  nan(): AllowLiteralShape<this, number>;

  /**
   * Replaces an input `NaN` value with a default output value.
   *
   * @param defaultValue The value that is used instead of `NaN` in the output.
   */
  nan<T extends Literal>(defaultValue: T): ReplaceLiteralShape<this, number, T>;

  nan(defaultValue?: any) {
    return this.replace(NaN, arguments.length === 0 ? NaN : defaultValue);
  }

  protected _getInputTypes(): unknown[] {
    if (this.isCoerced) {
      return [NUMBER, OBJECT, STRING, BOOLEAN, ARRAY, DATE, UNDEFINED, NULL];
    } else {
      return [NUMBER];
    }
  }

  protected _apply(input: any, options: ApplyOptions): Result<number> {
    const { _applyChecks } = this;

    let output = input;
    let issues = null;
    let changed = false;

    if (
      !this._typePredicate(output) &&
      (!(changed = options.coerced || this.isCoerced) || (output = this._coerce(input)) === NEVER)
    ) {
      return this._typeIssueFactory(input, options);
    }
    if ((_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) && changed) {
      return ok(output);
    }
    return issues;
  }

  /**
   * Coerces a value to a number (not `NaN`) or returns {@linkcode NEVER} if coercion isn't possible.
   *
   * @param value The non-number value to coerce.
   */
  protected _coerce(value: any): number {
    if (isArray(value) && value.length === 1 && typeof (value = value[0]) === 'number') {
      return this._typePredicate(value) ? value : NEVER;
    }
    if (value === null || value === undefined) {
      return 0;
    }

    value = canonize(value);

    if (
      (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number' || value instanceof Date) &&
      this._typePredicate((value = +value))
    ) {
      return value;
    }
    return NEVER;
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
