import { CODE_TYPE, MESSAGE_SYMBOL_TYPE, TYPE_SYMBOL } from '../constants';
import { ApplyOptions, ConstraintOptions, Message } from '../types';
import { createIssueFactory } from '../utils';
import { Result, Shape, Type } from './Shape';

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

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_SYMBOL_TYPE, options, TYPE_SYMBOL);
  }

  protected _getInputTypes(): readonly Type[] {
    return [TYPE_SYMBOL];
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
