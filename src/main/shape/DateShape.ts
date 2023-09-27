import { coerceToDate } from '../coerce';
import { CODE_TYPE } from '../constants';
import { isValidDate } from '../internal';
import { TYPE_ARRAY, TYPE_DATE, TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING } from '../Type';
import { ApplyOptions, IssueOptions, Message, Result } from '../types';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { NEVER, Shape } from './Shape';

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

  protected _getInputs(): unknown[] {
    if (this.isCoercing) {
      return [TYPE_DATE, TYPE_OBJECT, TYPE_STRING, TYPE_NUMBER, TYPE_ARRAY];
    } else {
      return [TYPE_DATE];
    }
  }

  protected _apply(input: any, options: ApplyOptions, nonce: number): Result<Date> {
    let output = input;

    if (!isValidDate(input) && (output = this._applyCoercion(input)) === NEVER) {
      return [this._typeIssueFactory(input, options)];
    }
    return this._applyOperations(input, output, options, null);
  }
}

DateShape.prototype['_coerce'] = coerceToDate;
