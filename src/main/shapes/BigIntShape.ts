import { Shape, ValueType } from './Shape';
import { ApplyResult, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { createIssueFactory } from '../utils';
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
    return ['bigint'];
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<bigint> {
    const { _applyChecks } = this;

    if (typeof input !== 'bigint') {
      return [this._issueFactory(input, options)];
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }
}
