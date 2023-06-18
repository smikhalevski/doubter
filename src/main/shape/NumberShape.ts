import {
  CODE_NUMBER_FINITE,
  CODE_NUMBER_INTEGER,
  CODE_TYPE,
  MESSAGE_NUMBER_FINITE,
  MESSAGE_NUMBER_INTEGER,
  MESSAGE_NUMBER_TYPE,
} from '../constants';
import { getCanonicalValueOf, isArray, isNumber, ok } from '../internal';
import { TYPE_ARRAY, TYPE_BOOLEAN, TYPE_DATE, TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING } from '../Type';
import { ApplyOptions, ConstraintOptions, Literal, Message } from '../types';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { AllowLiteralShape, NEVER, ReplaceLiteralShape, Result } from './Shape';

/**
 * The shape of a number value.
 */
export class NumberShape extends CoercibleShape<number> {
  /**
   * Returns `true` if an input is equal to the const value, or `false` otherwise.
   */
  protected _typePredicate = isNumber;

  /**
   * Returns issues associated with an invalid input value type.
   */
  protected _typeIssueFactory;

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
   * Constrains the number to be a finite number.
   *
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  finite(options?: ConstraintOptions | Message): this {
    const shape = this._clone();

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
    const shape = this._clone();

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

  protected _getInputs(): unknown[] {
    if (this.isCoerced) {
      return [TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING, TYPE_BOOLEAN, TYPE_ARRAY, TYPE_DATE, null, undefined];
    } else {
      return [TYPE_NUMBER];
    }
  }

  protected _apply(input: any, options: ApplyOptions, nonce: number): Result<number> {
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

    value = getCanonicalValueOf(value);

    if (
      (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number' || value instanceof Date) &&
      this._typePredicate((value = +value))
    ) {
      return value;
    }
    return NEVER;
  }
}