import { Shape, ValueType } from './Shape';
import { ApplyResult, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { createIssueFactory, isArray, ok } from '../utils';
import { CODE_TYPE, MESSAGE_BOOLEAN_TYPE, TYPE_BOOLEAN } from '../constants';

/**
 * The shape of the bigint value.
 */
export class BooleanShape extends Shape<boolean> {
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
    return [this.coerced ? 'boolean' : 'any'];
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<boolean> {
    const { _applyChecks } = this;

    if (options.coerced || this.coerced) {
      return this._applyToCoerced(input, options);
    }
    if (typeof input !== 'boolean') {
      return this._issueFactory(input, options);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }

  private _applyToCoerced(input: unknown, options: ParseOptions): ApplyResult<boolean> {
    const { _applyChecks } = this;

    const output = coerceBoolean(input);

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
}

function coerceBoolean(input: unknown): unknown {
  if (typeof input === 'boolean') {
    return input;
  }
  if (input === 'false' || input == false || input == null) {
    return false;
  }
  if (input === 'true' || input == true) {
    return true;
  }
  if (isArray(input) && input.length === 1 && typeof input[0] === 'boolean') {
    return input[0];
  }
  return input;
}
