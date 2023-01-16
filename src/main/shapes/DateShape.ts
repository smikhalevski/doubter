import { ValueType } from './Shape';
import { ApplyResult, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { createIssueFactory, isArray, ok } from '../utils';
import { CODE_TYPE, MESSAGE_DATE_TYPE, TYPE_ARRAY, TYPE_DATE, TYPE_NUMBER, TYPE_STRING } from '../constants';
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
    if (this._coerced) {
      return [TYPE_DATE, TYPE_STRING, TYPE_NUMBER, TYPE_ARRAY];
    } else {
      return [TYPE_DATE];
    }
  }

  protected _apply(input: any, options: ParseOptions): ApplyResult<Date> {
    const { _applyChecks } = this;

    const output = options.coerced || this._coerced ? this._coerce(input) : input;

    let issues: Issue[] | null = null;
    let time;

    if (!(output instanceof Date) || (time = output.getTime()) !== time) {
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

  protected _coerce(input: unknown): unknown {
    if (typeof input === 'string' || typeof input === 'number') {
      return new Date(input);
    }
    if (isArray(input) && input.length === 1) {
      return this._coerce(input[0]);
    }
    return input;
  }
}
