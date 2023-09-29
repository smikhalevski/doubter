import { symbolTypes } from '../coerce/symbol';
import { CODE_TYPE } from '../constants';
import { TYPE_SYMBOL } from '../Type';
import { ApplyOptions, IssueOptions, Message, Result } from '../types';
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
   * Creates a new {@link SymbolShape} instance.
   *
   * @param options The issue options or the issue message.
   */
  constructor(options?: IssueOptions | Message) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, Shape.messages['type.symbol'], options, TYPE_SYMBOL);
  }

  protected _getInputs(): readonly unknown[] {
    return symbolTypes;
  }

  protected _apply(input: unknown, options: ApplyOptions, nonce: number): Result<symbol> {
    if (typeof input !== 'symbol') {
      return [this._typeIssueFactory(input, options)];
    }
    return this._applyOperations(input, input, options, null);
  }
}
