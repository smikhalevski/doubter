import { Shape } from './Shape';
import { ApplyResult, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { bigintTypes, createIssueFactory } from '../utils';
import { CODE_TYPE, MESSAGE_BIGINT_TYPE, TYPE_BIGINT } from '../constants';

/**
 * The shape of the bigint value.
 */
export class BigIntShape extends Shape<bigint> {
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode BigIntShape} instance.
   *
   * @param options The type constraint options or the type issue message.
   */
  constructor(options?: TypeConstraintOptions | Message) {
    super(bigintTypes);

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_BIGINT_TYPE, options, TYPE_BIGINT);
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<bigint> {
    const { _applyChecks } = this;

    if (typeof input !== 'bigint') {
      return [this._typeIssueFactory(input)];
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }
}
