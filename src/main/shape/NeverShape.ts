import { CODE_NEVER, MESSAGE_NEVER } from '../constants';
import { ApplyOptions, ConstraintOptions, Message } from '../types';
import { createIssueFactory } from '../utils';
import { Result, Shape } from './Shape';

/**
 * The shape that doesn't match any input.
 *
 * @group Shapes
 */
export class NeverShape extends Shape<never> {
  /**
   * Returns issues associated with an invalid input value type.
   */
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode NeverShape} instance.
   *
   * @param options The type constraint options or the type issue message.
   */
  constructor(options?: ConstraintOptions | Message) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_NEVER, MESSAGE_NEVER, options, null);
  }

  protected _getInputs(): unknown[] {
    return [];
  }

  protected _apply(input: unknown, options: ApplyOptions, nonce: number): Result<never> {
    return [this._typeIssueFactory(input, options)];
  }
}
