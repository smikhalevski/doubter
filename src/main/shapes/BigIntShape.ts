import { ValueType } from './Shape';
import { ApplyResult, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { createIssueFactory, isArray, ok } from '../utils';
import {
  CODE_TYPE,
  MESSAGE_BIGINT_TYPE,
  TYPE_ARRAY,
  TYPE_BIGINT,
  TYPE_BOOLEAN,
  TYPE_NULL,
  TYPE_NUMBER,
  TYPE_STRING,
  TYPE_UNDEFINED,
} from '../constants';
import { CoercibleShape } from './CoercibleShape';

/**
 * The shape of the bigint value.
 */
export class BigIntShape extends CoercibleShape<bigint> {
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode BigIntShape} instance.
   *
   * @param options The type constraint options or the type issue message.
   */
  constructor(options?: TypeConstraintOptions | Message) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_BIGINT_TYPE, options, TYPE_BIGINT);
  }

  protected _getInputTypes(): ValueType[] {
    if (this._coerced) {
      return [TYPE_BIGINT, TYPE_STRING, TYPE_NUMBER, TYPE_BOOLEAN, TYPE_ARRAY, TYPE_UNDEFINED, TYPE_NULL];
    } else {
      return [TYPE_BIGINT];
    }
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<bigint> {
    const { _applyChecks } = this;

    const output = options.coerced || this._coerced ? this._coerce(input) : input;

    let issues: Issue[] | null = null;

    if (typeof output !== 'bigint') {
      return this._typeIssueFactory(input, options);
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
    if (typeof input === 'bigint') {
      return input;
    }
    if (input == null) {
      return BigInt(0);
    }
    if (isArray(input) && input.length === 1) {
      return this._coerce(input[0]);
    }
    if (typeof input === 'number' || typeof input === 'string' || typeof input === 'boolean') {
      try {
        return BigInt(input);
      } catch {}
    }
    return input;
  }
}
