import { CODE_TYPE } from '../constants';
import { freeze } from '../internal/lang';
import { Type } from '../Type';
import { ApplyOptions, IssueOptions, Message, Result } from '../types';
import { createIssueFactory } from '../utils';
import { Shape } from './Shape';

const symbolInputs = freeze([Type.SYMBOL]);

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

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, Shape.messages['type.symbol'], options, Type.SYMBOL);
  }

  protected _getInputs(): readonly unknown[] {
    return symbolInputs;
  }

  protected _apply(input: unknown, options: ApplyOptions, nonce: number): Result<symbol> {
    if (typeof input !== 'symbol') {
      return [this._typeIssueFactory(input, options)];
    }
    return this._applyOperations(input, input, options, null) as Result;
  }
}
