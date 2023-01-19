import { Shape, ValueType } from './Shape';
import { ApplyResult, ConstraintOptions, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { clone, createIssueFactory, isArray, isNumber, ok, setCheck } from '../utils';
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
  constructor(options?: TypeConstraintOptions | Message) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_NUMBER_TYPE, options, TYPE_NUMBER);
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

    return setCheck(this, CODE_NUMBER_GT, options, value, (input, options) => {
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

    return setCheck(this, CODE_NUMBER_LT, options, value, (input, options) => {
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

    return setCheck(this, CODE_NUMBER_GTE, options, value, (input, options) => {
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

    return setCheck(this, CODE_NUMBER_LTE, options, value, (input, options) => {
      if (input > value) {
        return issueFactory(input, options);
      }
    });
  }

  /**
   * Constrains the number to be a multiple of the divisor.
   *
   * @param value The number by which the input should be divisible without a remainder.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  multipleOf(value: number, options?: ConstraintOptions | Message): this {
    const issueFactory = createIssueFactory(CODE_NUMBER_MULTIPLE_OF, MESSAGE_NUMBER_MULTIPLE_OF, options, value);

    return setCheck(this, CODE_NUMBER_MULTIPLE_OF, options, value, (input, options) => {
      if (input % value !== 0) {
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
    const shape = clone(this);

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
    const shape = clone(this);

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

  protected _getInputTypes(): ValueType[] {
    if (this._coerced) {
      return [TYPE_NUMBER, TYPE_STRING, TYPE_BOOLEAN, TYPE_ARRAY, TYPE_DATE, TYPE_UNDEFINED, TYPE_NULL];
    } else {
      return [TYPE_NUMBER];
    }
  }

  protected _apply(input: any, options: ParseOptions): ApplyResult<number> {
    const { _applyChecks } = this;

    const output = options.coerced || this._coerced ? this._coerce(input) : input;

    let issues: Issue[] | null = null;

    if (!this._typePredicate(output)) {
      return this._typeIssueFactory(input, options);
    }
    if (_applyChecks !== null) {
      issues = _applyChecks(output, null, options);
    }
    if (issues === null && input !== output) {
      return ok(output);
    }
    return issues;
  }

  protected _coerce(input: unknown): unknown {
    if (typeof input === 'number') {
      return input;
    }
    if (input == null) {
      return 0;
    }
    if (typeof input === 'string' || typeof input === 'boolean' || input instanceof Date) {
      return +input;
    }
    if (isArray(input) && input.length === 1) {
      return this._coerce(input[0]);
    }
    return input;
  }
}

export interface NumberShape {
  /**
   * Alias for {@linkcode gte}.
   *
   * Constrains the number to be greater than or equal to the value.
   *
   * @param value The inclusive minimum value.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  min(value: number, options?: ConstraintOptions | Message): this;

  /**
   * Alias for {@linkcode lte}.
   *
   * Constrains the number to be less than or equal to the value.
   *
   * @param value The inclusive maximum value.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  max(value: number, options?: ConstraintOptions | Message): this;
}

NumberShape.prototype.min = NumberShape.prototype.gte;

NumberShape.prototype.max = NumberShape.prototype.lte;
