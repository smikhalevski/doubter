import { coerceToDate, dateCoercibleTypes } from '../coerce/date';
import { NEVER } from '../coerce/never';
import { CODE_TYPE } from '../constants';
import { isValidDate } from '../internal/lang';
import { dateTypes, TYPE_DATE } from '../Type';
import { ApplyOptions, IssueOptions, Message, Result } from '../typings';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { Shape } from './Shape';

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

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, Shape.messages['type.date'], options, TYPE_DATE);
  }

  protected _getInputs(): readonly unknown[] {
    return this.isCoercing ? dateCoercibleTypes : dateTypes;
  }

  protected _apply(input: any, options: ApplyOptions, nonce: number): Result<Date> {
    let output = input;

    if (!isValidDate(input) && (output = this._applyCoerce(input)) === NEVER) {
      return [this._typeIssueFactory(input, options)];
    }
    return this._applyOperations(input, output, options, null);
  }
}

DateShape.prototype['_coerce'] = coerceToDate;
