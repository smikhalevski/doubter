import { ApplyResult, ValueType } from './Shape';
import { ConstraintOptions, Message, ParseOptions } from '../shared-types';
import { createIssueFactory, isArray, isDate, ok } from '../utils';
import { CODE_TYPE, MESSAGE_DATE_TYPE, TYPE_ARRAY, TYPE_DATE, TYPE_NUMBER, TYPE_STRING } from '../constants';
import { CoercibleShape } from './CoercibleShape';

/**
 * The shape of the `Date` object.
 */
export class DateShape extends CoercibleShape<Date> {
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

  protected _getInputTypes(): readonly ValueType[] {
    if (this._coerced) {
      return [TYPE_DATE, TYPE_STRING, TYPE_NUMBER, TYPE_ARRAY];
    } else {
      return [TYPE_DATE];
    }
  }

  protected _apply(input: any, options: ParseOptions): ApplyResult<Date> {
    const { _applyChecks } = this;

    let output = input;
    let issues = null;
    let changed = false;

    if (!isDate(input) && (!(changed = options.coerced || this._coerced) || (output = this._coerce(input)) === null)) {
      return this._typeIssueFactory(input, options);
    }
    if ((_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) && changed) {
      return ok(output);
    }
    return issues;
  }

  /**
   * Coerces value to a `Date` or returns `null` if coercion isn't possible.
   *
   * @param value The non-`Date` value to coerce.
   */
  protected _coerce(value: unknown): Date | null {
    if (isArray(value) && value.length === 1 && isDate((value = value[0]))) {
      return value;
    }
    if ((typeof value === 'string' || typeof value === 'number') && isDate((value = new Date(value)))) {
      return value;
    }
    return null;
  }
}
