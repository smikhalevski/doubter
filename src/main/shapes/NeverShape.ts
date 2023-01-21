import { ApplyResult, Shape, ValueType } from './Shape';
import { Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { createIssueFactory } from '../utils';
import { CODE_NEVER, MESSAGE_NEVER, TYPE_NEVER } from '../constants';

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
  constructor(options?: TypeConstraintOptions | Message) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_NEVER, MESSAGE_NEVER, options, undefined);
  }

  protected _getInputTypes(): ValueType[] {
    return [TYPE_NEVER];
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<never> {
    return this._typeIssueFactory(input, options);
  }
}
