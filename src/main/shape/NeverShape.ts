import { CODE_TYPE_NEVER, MESSAGE_TYPE_NEVER } from '../constants';
import { IssueOptions, Message, ParseOptions, Result } from '../types';
import { createIssue } from '../utils';
import { Shape } from './Shape';

const neverInputs = Object.freeze<unknown[]>([]);

/**
 * The shape that doesn't match any input.
 *
 * @group Shapes
 */
export class NeverShape extends Shape<never> {
  /**
   * The type issue options or the type issue message.
   */
  protected _options;

  /**
   * Creates a new {@link NeverShape} instance.
   *
   * @param options The issue options or the issue message.
   */
  constructor(options?: IssueOptions | Message) {
    super();

    this._options = options;
  }

  protected _getInputs(): readonly unknown[] {
    return neverInputs;
  }

  protected _apply(input: unknown, options: ParseOptions, _nonce: number): Result<never> {
    return [createIssue(CODE_TYPE_NEVER, input, MESSAGE_TYPE_NEVER, undefined, options, this._options)];
  }
}
