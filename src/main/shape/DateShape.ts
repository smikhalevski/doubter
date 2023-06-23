import { CODE_TYPE, MESSAGE_DATE_TYPE } from '../constants';
import { getCanonicalValueOf, isArray, isValidDate, ok } from '../internal';
import { TYPE_ARRAY, TYPE_DATE, TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING } from '../Type';
import { ApplyOptions, ConstraintOptions, Message } from '../types';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { NEVER, Result } from './Shape';

/**
 * The shape of the `Date` object.
 * @group Shapes
 */
export class DateShape extends CoercibleShape<Date> {
  /**
   * Returns issues associated with an invalid input value type.
   */
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode DateShape} instance.
   *
   * @param options The type constraint options or the type issue message.
   */
  constructor(options?: ConstraintOptions | Message) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_DATE_TYPE, options, TYPE_DATE);
  }

  protected _getInputs(): unknown[] {
    if (this.isCoercing) {
      return [TYPE_DATE, TYPE_OBJECT, TYPE_STRING, TYPE_NUMBER, TYPE_ARRAY];
    } else {
      return [TYPE_DATE];
    }
  }

  protected _apply(input: any, options: ApplyOptions, nonce: number): Result<Date> {
    const { _applyOperations } = this;

    let output = input;
    let changed = false;

    if (
      !isValidDate(input) &&
      (!(changed = options.coerce || this.isCoercing) || (output = this._coerce(input)) === NEVER)
    ) {
      return [this._typeIssueFactory(input, options)];
    }
    if (_applyOperations !== null) {
      return _applyOperations(output, options, changed, null, null);
    }
    if (changed) {
      return ok(output);
    }
    return null;
  }

  /**
   * Coerces a value to a `Date`.
   *
   * @param value The non-`Date` value to coerce.
   * @returns A `Date` value, or {@linkcode NEVER} if coercion isn't possible.
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
