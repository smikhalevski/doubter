import { ValueType } from './Shape';
import { ApplyResult, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { createIssueFactory, dateTypes, isArray, ok } from '../utils';
import { CODE_TYPE, MESSAGE_DATE_TYPE, TYPE_DATE, TYPE_NUMBER, TYPE_STRING } from '../constants';
import { CoercibleShape } from './CoercibleShape';

/**
 * The shape of the `Date` object.
 */
export class DateShape extends CoercibleShape<Date> {
  protected _issueFactory;

  /**
   * Creates a new {@linkcode DateShape} instance.
   *
   * @param options The type constraint options or the type issue message.
   */
  constructor(options?: TypeConstraintOptions | Message) {
    super();

    this._issueFactory = createIssueFactory(CODE_TYPE, MESSAGE_DATE_TYPE, options, TYPE_DATE);
  }

  protected _getInputTypes(): ValueType[] {
    return this._coerced ? [TYPE_DATE, TYPE_STRING, TYPE_NUMBER] : dateTypes;
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<Date> {
    const { _applyChecks } = this;

    if (options.coerced || this._coerced) {
      return this._applyToCoerced(input, options);
    }
    if (!isValidDate(input)) {
      return this._issueFactory(input, options);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }

  private _applyToCoerced(input: unknown, options: ParseOptions): ApplyResult<Date> {
    const { _applyChecks } = this;

    const output = coerceDate(input, input);

    let issues: Issue[] | null = null;

    if (!isValidDate(output)) {
      return this._issueFactory(input, options);
    }
    if (_applyChecks !== null) {
      issues = _applyChecks(output, null, options);
    }
    if (issues === null && input !== output) {
      return ok(output);
    }
    return issues;
  }
}

export function isValidDate(value: unknown): value is Date {
  let time;
  return value instanceof Date && (time = value.getTime()) === time;
}

export function coerceDate(value: unknown, defaultValue: unknown): unknown {
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    const time = date.getTime();

    if (time !== time) {
      return defaultValue;
    }
    return date;
  }
  if (isArray(value) && value.length === 1) {
    return coerceDate(value[0], defaultValue);
  }
  return defaultValue;
}
