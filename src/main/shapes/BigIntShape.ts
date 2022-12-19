import { ValueType } from './Shape';
import { ApplyResult, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { bigintTypes, coercibleTypes, createIssueFactory, isArray, ok } from '../utils';
import { CODE_TYPE, MESSAGE_BIGINT_TYPE, TYPE_BIGINT } from '../constants';
import { CoercibleShape } from './CoercibleShape';

/**
 * The shape of the bigint value.
 */
export class BigIntShape extends CoercibleShape<bigint> {
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
    return this._coerced ? coercibleTypes : bigintTypes;
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<bigint> {
    const { _applyChecks } = this;

    if (options.coerced || this._coerced) {
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

export function coerceBigInt(value: any): unknown {
  const type = typeof value;

  if (value == null) {
    return BigInt(0);
  }
  if (type === 'bigint') {
    return value;
  }
  if (isArray(value) && value.length === 1 && typeof value[0] === 'bigint') {
    return value[0];
  }
  if (type === 'number' || type === 'string' || type === 'boolean') {
    try {
      return BigInt(value);
    } catch {}
  }
  return value;
}
