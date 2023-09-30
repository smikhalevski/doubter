import { CODE_TYPE } from '../constants';
import { getCanonicalValueOf, isArray, isValidDate } from '../internal';
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

    if (!isValidDate(input) && (!(options.coerce || this.isCoercing) || (output = this._coerce(input)) === NEVER)) {
      return [this._typeIssueFactory(input, options)];
    }
    return this._applyOperations(input, output, options, null);
  }

  /**
   * Coerces a value to a {@link !Date Date}.
   *
   * @param value The non-{@link !Date Date} value to coerce.
   * @returns A {@link !Date Date} value, or {@link NEVER} if coercion isn't possible.
   */
  protected _coerce(value: unknown): Date {
    if (isArray(value) && value.length === 1 && isValidDate((value = value[0]))) {
      return value;
    }

    value = getCanonicalValueOf(value);

    if ((typeof value === 'string' || typeof value === 'number') && isValidDate((value = new Date(value)))) {
      return value;
    }
    return NEVER;
  }
}
