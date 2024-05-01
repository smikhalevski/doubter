import { coerceToDate, dateCoercibleInputs } from '../coerce/date';
import { NEVER } from '../coerce/never';
import { CODE_TYPE_DATE, MESSAGE_TYPE_DATE } from '../constants';
import { isValidDate } from '../internal/lang';
import { Type } from '../Type';
import { IssueOptions, Message, ParseOptions, Result } from '../types';
import { createIssue } from '../utils';
import { CoercibleShape } from './CoercibleShape';

const dateInputs = Object.freeze([Type.DATE]);

/**
 * The shape of the {@link !Date Date} object.
 * @group Shapes
 */
export class DateShape extends CoercibleShape<Date> {
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

  protected _getInputs(): readonly unknown[] {
    return this.isCoercing ? dateCoercibleInputs : dateInputs;
  }

  protected _apply(input: any, options: ParseOptions, _nonce: number): Result<Date> {
    let output = input;

    if (!isValidDate(input) && (output = this._applyCoerce(input)) === NEVER) {
      return [createIssue(CODE_TYPE_DATE, input, MESSAGE_TYPE_DATE, undefined, options, this._options)];
    }
    return this._applyOperations(input, output, options, null) as Result;
  }
}

DateShape.prototype['_coerce'] = coerceToDate;
