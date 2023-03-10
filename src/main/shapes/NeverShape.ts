import { CODE_TYPE, MESSAGE_NEVER_TYPE } from '../constants';
import { ApplyOptions, ConstraintOptions, Message } from '../types';
import { createIssueFactory } from '../utils';
import { Result, Shape } from './Shape';

/**
 * The shape that doesn't match any input.
 */
export class NeverShape extends Shape<never> {
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode NeverShape} instance.
   *
   * @param options The type constraint options or the type issue message.
   */
  constructor(options?: ConstraintOptions | Message) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_NEVER_TYPE, options, null);
  }

  protected _getInputTypes(): unknown[] {
    return [];
  }

  protected _apply(input: unknown, options: ApplyOptions): Result<never> {
    return this._typeIssueFactory(input, options);
  }
}
