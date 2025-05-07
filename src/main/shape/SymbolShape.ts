import { CODE_TYPE_SYMBOL, MESSAGE_TYPE_SYMBOL } from '../constants.ts';
import { Type } from '../Type.ts';
import { IssueOptions, Message, ParseOptions, Result } from '../types.ts';
import { createIssue } from '../utils.ts';
import { Shape } from './Shape.ts';

const symbolInputs = Object.freeze<unknown[]>([Type.SYMBOL]);

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
