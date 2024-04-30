import { CODE_TYPE_NEVER, MESSAGE_TYPE_NEVER } from '../constants';
import { ApplyOptions, IssueOptions, Message, Result } from '../types';
import { createIssue, toIssueOptions } from '../utils';
import { Shape } from './Shape';

const neverInputs = Object.freeze([]);

/**
 * The shape that doesn't match any input.
 *
 * @group Shapes
 */
export class NeverShape extends Shape<never> {
  /**
   * Returns issues associated with an invalid input value type.
   */
  protected _options;

  /**
   * Creates a new {@link NeverShape} instance.
   *
   * @param options The issue options or the issue message.
   */
  constructor(options?: IssueOptions | Message) {
    super();

    this._options = toIssueOptions(options);
  }

  protected _getInputs(): readonly unknown[] {
    return neverInputs;
  }

  protected _apply(input: unknown, options: ApplyOptions, nonce: number): Result<never> {
    return [createIssue(CODE_TYPE_NEVER, input, MESSAGE_TYPE_NEVER, undefined, options, this._options)];
  }
}
