import { Shape } from './Shape';
import { ApplyResult, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { booleanTypes, createIssueFactory } from '../utils';
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
    super(booleanTypes);

    this._issueFactory = createIssueFactory(CODE_TYPE, MESSAGE_BOOLEAN_TYPE, options, TYPE_BOOLEAN);
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<boolean> {
    const { _applyChecks } = this;

    if (typeof input !== 'boolean') {
      return [this._issueFactory(input, options)];
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }
}
