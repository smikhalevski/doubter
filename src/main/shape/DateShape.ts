import { coerceToDate, dateCoercibleInputs } from '../coerce/date.js';
import { NEVER } from '../coerce/never.js';
import { CODE_TYPE_DATE, MESSAGE_TYPE_DATE } from '../constants.js';
import { isValidDate } from '../internal/lang.js';
import { Type } from '../Type.js';
import { IssueOptions, Message, ParseOptions, Result } from '../types.js';
import { createIssue } from '../utils.js';
import { Shape } from './Shape.js';

const dateInputs = Object.freeze<unknown[]>([Type.DATE]);

/**
 * The shape of the {@link !Date} object.
 *
 * @group Shapes
 */
export class DateShape extends Shape<Date> {
  /**
   * `true` if this shape coerces input values to the required type during parsing, or `false` otherwise.
   */
  isCoercing = false;

  /**
   * The type issue options or the type issue message.
   */
  protected _options;

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
   * Enables an input value coercion.
   *
   * @returns The clone of the shape.
   */
  coerce(): this {
    const shape = this._clone();
    shape.isCoercing = true;
    return shape;
  }

  protected _getInputs(): readonly unknown[] {
    return this.isCoercing ? dateCoercibleInputs : dateInputs;
  }

  protected _apply(input: any, options: ParseOptions, _nonce: number): Result<Date> {
    let output = input;

    if (!isValidDate(input) && (!this.isCoercing || (output = coerceToDate(input)) === NEVER)) {
      return [createIssue(CODE_TYPE_DATE, input, MESSAGE_TYPE_DATE, undefined, options, this._options)];
    }
    return this._applyOperations(input, output, options, null) as Result;
  }
}
