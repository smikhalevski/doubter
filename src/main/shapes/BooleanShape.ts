import { ValueType } from './Shape';
import { ApplyResult, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { booleanTypes, coercibleTypes, createIssueFactory, isArray, ok } from '../utils';
import { CODE_TYPE, MESSAGE_BOOLEAN_TYPE, TYPE_BOOLEAN } from '../constants';
import { CoercibleShape } from './CoercibleShape';

/**
 * The shape of the bigint value.
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
    return this._coerced ? coercibleTypes : booleanTypes;
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<boolean> {
    const { _applyChecks } = this;

    if (options.coerced || this._coerced) {
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

    const output = coerceBoolean(input, input);

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

export function coerceBoolean(value: unknown, defaultValue: unknown): unknown {
  if (value == null) {
    return false;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (value == null || value === false || value === 0 || value === 'false' || value === BigInt(0)) {
    return false;
  }
  if (value === true || value === 1 || value === 'true' || value === BigInt(1)) {
    return true;
  }
  if (isArray(value) && value.length === 1) {
    return coerceBoolean(value[0], defaultValue);
  }
  return defaultValue;
}
