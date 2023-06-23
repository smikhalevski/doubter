import { CODE_TYPE, MESSAGE_SYMBOL_TYPE } from '../constants';
import { TYPE_SYMBOL } from '../Type';
import { ApplyOptions, ConstraintOptions, Message, Result } from '../types';
import { createIssueFactory } from '../utils';
import { Shape } from './Shape';

/**
 * The shape of an arbitrary symbol value.
 *
 * @group Shapes
 */
export class SymbolShape extends Shape<symbol> {
  /**
   * Returns issues associated with an invalid input value type.
   */
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

  protected _getInputs(): unknown[] {
    return [TYPE_SYMBOL];
  }

  protected _apply(input: unknown, options: ApplyOptions, nonce: number): Result<symbol> {
    const { _applyOperations } = this;

    if (typeof input !== 'symbol') {
      return [this._typeIssueFactory(input, options)];
    }
    if (_applyOperations !== null) {
      return _applyOperations(input, options, false, null, null);
    }
    return null;
  }
}
