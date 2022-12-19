import { Shape, ValueType } from './Shape';
import { ApplyResult, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { createIssueFactory, isArray, ok } from '../utils';
import { CODE_TYPE, MESSAGE_BIGINT_TYPE, TYPE_BIGINT } from '../constants';

/**
 * The shape of the bigint value.
 */
export class BigIntShape extends Shape<bigint> {
  protected _issueFactory;

  /**
   * Creates a new {@linkcode BigIntShape} instance.
   *
   * @param options The type constraint options or the type issue message.
   */
  constructor(options?: TypeConstraintOptions | Message) {
    super();

    this._issueFactory = createIssueFactory(CODE_TYPE, MESSAGE_BIGINT_TYPE, options, TYPE_BIGINT);
  }

  protected _getInputTypes(): ValueType[] {
    return [this.coerced ? 'any' : 'bigint'];
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<bigint> {
    const { _applyChecks } = this;

    if (options.coerced || this.coerced) {
      return this._applyToCoerced(input, options);
    }
    if (typeof input !== 'bigint') {
      return this._issueFactory(input, options);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }

  private _applyToCoerced(input: unknown, options: ParseOptions): ApplyResult<bigint> {
    const { _applyChecks } = this;

    const output = coerceBigInt(input);

    let issues: Issue[] | null = null;

    if (typeof output !== 'bigint') {
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

function coerceBigInt(input: any): unknown {
  if (typeof input === 'bigint') {
    return input;
  }
  if (isArray(input) && input.length === 1 && typeof input[0] === 'bigint') {
    return input[0];
  }
  try {
    return BigInt(input);
  } catch {
    return input;
  }
}
