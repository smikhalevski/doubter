import { Shape, ValueType } from './Shape';
import { ApplyResult, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { createIssueFactory } from '../utils';
import { CODE_NEVER, MESSAGE_NEVER } from '../constants';

/**
 * The shape that doesn't match any input.
 */
export class NeverShape extends Shape<never> {
  protected _issueFactory;

  /**
   * Creates a new {@linkcode NeverShape} instance.
   *
   * @param options The type constraint options or the type issue message.
   */
  constructor(options?: TypeConstraintOptions | Message) {
    super();

    this._issueFactory = createIssueFactory(CODE_NEVER, MESSAGE_NEVER, options, undefined);
  }

  protected _getInputTypes(): ValueType[] {
    return ['never'];
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<never> {
    return this._issueFactory(input, options);
  }
}
