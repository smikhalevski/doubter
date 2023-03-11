import { CODE_TYPE, MESSAGE_SYMBOL_TYPE } from '../constants';
import { ApplyOptions, ConstraintOptions, Message } from '../types';
import { createIssueFactory, SYMBOL } from '../utils';
import { Result, Shape } from './Shape';

/**
 * The shape of the arbitrary symbol.
 */
export class SymbolShape extends Shape<symbol> {
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode SymbolShape} instance.
   *
   * @param options The type constraint options or the type issue message.
   */
  constructor(options?: ConstraintOptions | Message) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_SYMBOL_TYPE, options, SYMBOL);
  }

  protected _getInputTypes(): unknown[] {
    return [SYMBOL];
  }

  protected _apply(input: unknown, options: ApplyOptions): Result<symbol> {
    const { _applyChecks } = this;

    if (typeof input !== 'symbol') {
      return this._typeIssueFactory(input, options);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }
}
