import { ReplaceShape, Shape, ValueType } from './Shape';
import { ApplyResult, ConstraintOptions, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { appendCheck, coercibleTypes, createIssueFactory, isArray, numberTypes, ok } from '../utils';
import {
  CODE_NUMBER_GT,
  CODE_NUMBER_GTE,
  CODE_NUMBER_LT,
  CODE_NUMBER_LTE,
  CODE_NUMBER_MULTIPLE_OF,
  CODE_TYPE,
  MESSAGE_INTEGER_TYPE,
  MESSAGE_NUMBER_GT,
  MESSAGE_NUMBER_GTE,
  MESSAGE_NUMBER_LT,
  MESSAGE_NUMBER_LTE,
  MESSAGE_NUMBER_MULTIPLE_OF,
  MESSAGE_NUMBER_TYPE,
  TYPE_INTEGER,
  TYPE_NUMBER,
} from '../constants';
import { CoercibleShape } from './CoercibleShape';

/**
 * The shape of the finite number.
 */
export class NumberShape extends CoercibleShape<number> {
  protected _issueFactory;
  protected _typePredicate = Number.isFinite;

  /**
   * Creates a new {@linkcode NumberShape} instance.
   *
   * @param options The type constraint options or the type issue message.
   */
  constructor(options?: TypeConstraintOptions | Message) {
    super();

    this._issueFactory = createIssueFactory(CODE_TYPE, MESSAGE_NUMBER_TYPE, options, TYPE_NUMBER);
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
   * Constrains the number to be greater than the value.
   *
   * @param value The exclusive minimum value.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  gt(value: number, options?: ConstraintOptions | Message): this {
    const issueFactory = createIssueFactory(CODE_NUMBER_GT, MESSAGE_NUMBER_GT, options, value);

    return appendCheck(this, CODE_NUMBER_GT, options, value, (input, options) => {
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

    return appendCheck(this, CODE_NUMBER_LT, options, value, (input, options) => {
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

    return appendCheck(this, CODE_NUMBER_GTE, options, value, (input, options) => {
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

    return appendCheck(this, CODE_NUMBER_LTE, options, value, (input, options) => {
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

    return appendCheck(this, CODE_NUMBER_MULTIPLE_OF, options, value, (input, options) => {
      if (input % value !== 0) {
        return issueFactory(input, options);
      }
    });
  }

  /**
   * Allow `NaN` input values.
   *
   * @param defaultValue The value that is used instead of `NaN` in the output.
   */
  nan(defaultValue = NaN): Shape<number> {
    return new ReplaceShape(this, NaN, defaultValue);
  }

  /**
   * Constrains the number to be an integer and rejects `Infinity` and `NaN` values.
   *
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  integer(options?: ConstraintOptions | Message): this {
    const shape = this._clone();

    shape._issueFactory = createIssueFactory(CODE_TYPE, MESSAGE_INTEGER_TYPE, options, TYPE_INTEGER);
    shape._typePredicate = Number.isInteger;

    return shape;
  }

  protected _getInputTypes(): ValueType[] {
    return this._coerced ? coercibleTypes : numberTypes;
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<number> {
    const { _typePredicate, _applyChecks } = this;

    if (options.coerced || this._coerced) {
      return this._applyToCoerced(input, options);
    }
    if (!_typePredicate(input)) {
      return this._issueFactory(input, options);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }

  private _applyToCoerced(input: unknown, options: ParseOptions): ApplyResult<number> {
    const { _typePredicate, _applyChecks } = this;

    const output = coerceNumber(input, input);

    let issues: Issue[] | null = null;

    if (!_typePredicate(output)) {
      return this._issueFactory(input, options);
    }
    if (_applyChecks !== null) {
      issues = _applyChecks(output, null, options);
    }
    if (issues === null && input !== output) {
      return ok(output);
    }
    return issues;
  }
}

export function coerceNumber(value: unknown, defaultValue: unknown): any {
  const type = typeof value;

  if (value == null) {
    return 0;
  }
  if (type === 'number') {
    if (value !== value) {
      return defaultValue;
    }
    return value;
  }
  if (type === 'string') {
    const result = +value;

    if (result !== result) {
      return defaultValue;
    }
    return result;
  }
  if (type === 'boolean') {
    return +value;
  }
  if (type === 'object') {
    if (isArray(value) && value.length === 1) {
      return coerceNumber(value[0], defaultValue);
    }
    if (value instanceof Date) {
      return value.getTime();
    }
    return defaultValue;
  }

  return defaultValue;
}
