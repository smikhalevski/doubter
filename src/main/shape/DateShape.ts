import { coerceToDate, dateCoercibleInputs } from '../coerce/date';
import { NEVER } from '../coerce/never';
import { CODE_TYPE_DATE, MESSAGE_TYPE_DATE } from '../constants';
import { isValidDate } from '../internal/lang';
import { Type } from '../Type';
import { IssueOptions, Message, ParseOptions, Result } from '../types';
import { createIssue } from '../utils';
import { Shape } from './Shape';

const dateInputs = Object.freeze<unknown[]>([Type.DATE]);

/**
 * The shape of the {@link !Date} object.
 *
 * @group Shapes
 */
export class DateShape extends Shape<Date> {
  /**
   * The type issue options or the type issue message.
   */
  protected _options;

  /**
   * Coerces an input value to a date.
   *
   * @param input The input value to coerce.
   * @returns The coerced value, or {@link NEVER} if coercion isn't possible.
   */
  protected _applyCoerce?: (input: unknown) => Date = undefined;

  /**
   * Creates a new {@link DateShape} instance.
   *
   * @param options The issue options or the issue message.
   */
  constructor(options?: IssueOptions | Message) {
    super();

    this._options = options;
  }

  /**
   * `true` if this shape coerces input values to the required type during parsing, or `false` otherwise.
   */
  get isCoercing() {
    return this._applyCoerce !== undefined;
  }

  /**
   * Enables an input value coercion.
   *
   * @returns The clone of the shape.
   */
  coerce(): this {
    const shape = this._clone();
    shape._applyCoerce = coerceToDate;
    return shape;
  }

  protected _getInputs(): readonly unknown[] {
    return this.isCoercing ? dateCoercibleInputs : dateInputs;
  }

  protected _apply(input: any, options: ParseOptions, _nonce: number): Result<Date> {
    let output = input;

    if (!isValidDate(input) && (this._applyCoerce === undefined || (output = this._applyCoerce(input)) === NEVER)) {
      return [createIssue(CODE_TYPE_DATE, input, MESSAGE_TYPE_DATE, undefined, options, this._options)];
    }
    return this._applyOperations(input, output, options, null) as Result;
  }
}
