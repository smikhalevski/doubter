import { CODE_TYPE_SYMBOL, MESSAGE_TYPE_SYMBOL } from '../constants';
import { Type } from '../Type';
import { IssueOptions, Message, ParseOptions, Result } from '../types';
import { createIssue } from '../utils';
import { Shape } from './Shape';

const symbolInputs = Object.freeze([Type.SYMBOL]);

/**
 * The shape of an arbitrary symbol value.
 *
 * @group Shapes
 */
export class SymbolShape extends Shape<symbol> {
  /**
   * The type issue options or the type issue message.
   */
  protected _options;

  /**
   * Creates a new {@link SymbolShape} instance.
   *
   * @param options The issue options or the issue message.
   */
  constructor(options?: IssueOptions | Message) {
    super();

    this._options = options;
  }

  protected _getInputs(): readonly unknown[] {
    return symbolInputs;
  }

  protected _apply(input: unknown, options: ParseOptions, _nonce: number): Result<symbol> {
    if (typeof input !== 'symbol') {
      return [createIssue(CODE_TYPE_SYMBOL, input, MESSAGE_TYPE_SYMBOL, undefined, options, this._options)];
    }
    return this._applyOperations(input, input, options, null) as Result;
  }
}
