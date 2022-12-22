import { Shape, ValueType } from './Shape';
import { ApplyResult, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { createIssueFactory, symbolTypes } from '../utils';
import { CODE_TYPE, MESSAGE_SYMBOL_TYPE, TYPE_SYMBOL } from '../constants';

/**
 * The shape of the arbitrary symbol.
 */
export class SymbolShape extends Shape<symbol> {
  protected _issueFactory;

  /**
   * Creates a new {@linkcode SymbolShape} instance.
   *
   * @param options The type constraint options or the type issue message.
   */
  constructor(options?: TypeConstraintOptions | Message) {
    super();

    this._issueFactory = createIssueFactory(CODE_TYPE, MESSAGE_SYMBOL_TYPE, options, TYPE_SYMBOL);
  }

  protected _getInputTypes(): ValueType[] {
    return symbolTypes;
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<symbol> {
    const { _applyChecks } = this;

    if (typeof input !== 'symbol') {
      return this._issueFactory(input, options);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }
}
