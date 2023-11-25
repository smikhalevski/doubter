import { coerceToDate, dateCoercibleInputs } from '../coerce/date';
import { NEVER } from '../coerce/never';
import { CODE_TYPE } from '../constants';
import { freeze, isValidDate } from '../internal/lang';
import { Type } from '../Type';
import { ApplyOptions, IssueOptions, Message, Result } from '../types';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { Shape } from './Shape';

const dateInputs = freeze([Type.DATE]);

/**
 * The shape of the {@link !Date Date} object.
 * @group Shapes
 */
export class DateShape extends CoercibleShape<Date> {
  /**
   * Returns issues associated with an invalid input value type.
   */
  protected _typeIssueFactory;

  /**
   * Creates a new {@link DateShape} instance.
   *
   * @param options The issue options or the issue message.
   */
  constructor(options?: IssueOptions | Message) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, Shape.messages['type.date'], options, Type.DATE);
  }

  protected _getInputs(): readonly unknown[] {
    return this.isCoercing ? dateCoercibleInputs : dateInputs;
  }

  protected _apply(input: any, options: ApplyOptions, nonce: number): Result<Date> {
    let output = input;

    if (!isValidDate(input) && (output = this._applyCoerce(input)) === NEVER) {
      return [this._typeIssueFactory(input, options)];
    }
    return this._applyOperations(input, output, options, null) as Result;
  }
}

DateShape.prototype['_coerce'] = coerceToDate;
