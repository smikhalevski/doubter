import { ValueType } from './Shape';
import { ApplyResult, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { createIssueFactory, isArray, ok } from '../utils';
import {
  CODE_TYPE,
  MESSAGE_BOOLEAN_TYPE,
  TYPE_ARRAY,
  TYPE_BOOLEAN,
  TYPE_NULL,
  TYPE_NUMBER,
  TYPE_STRING,
  TYPE_UNDEFINED,
} from '../constants';
import { CoercibleShape } from './CoercibleShape';

/**
 * The shape of the boolean value.
 */
export class BooleanShape extends CoercibleShape<boolean> {
  protected _issueFactory;

  /**
   * Creates a new {@linkcode BooleanShape} instance.
   *
   * @param options The type constraint options or the type issue message.
   */
  constructor(options?: TypeConstraintOptions | Message) {
    super();

    this._issueFactory = createIssueFactory(CODE_TYPE, MESSAGE_BOOLEAN_TYPE, options, TYPE_BOOLEAN);
  }

  protected _getInputTypes(): ValueType[] {
    if (this._coerced) {
      return [TYPE_BOOLEAN, TYPE_STRING, TYPE_NUMBER, TYPE_ARRAY, TYPE_NULL, TYPE_UNDEFINED];
    } else {
      return [TYPE_BOOLEAN];
    }
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<boolean> {
    const { _applyChecks } = this;

    const output = options.coerced || this._coerced ? this._coerce(input) : input;

    let issues: Issue[] | null = null;

    if (typeof output !== 'boolean') {
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
    if (typeof input === 'boolean') {
      return input;
    }
    if (input == null || input === false || input === 0 || input === 'false') {
      return false;
    }
    if (input === true || input === 1 || input === 'true') {
      return true;
    }
    if (isArray(input) && input.length === 1) {
      return this._coerce(input[0]);
    }
    return input;
  }
}
