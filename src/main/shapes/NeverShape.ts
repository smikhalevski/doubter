import { Result, Shape, ValueType } from './Shape';
import { ConstraintOptions, Message, ParseOptions } from '../shared-types';
import { createIssueFactory } from '../utils';
import { CODE_TYPE, MESSAGE_NEVER_TYPE, TYPE_NEVER } from '../constants';

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

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_NEVER_TYPE, options, TYPE_NEVER);
  }

  protected _getInputTypes(): readonly ValueType[] {
    return [TYPE_NEVER];
  }

  protected _apply(input: unknown, options: ParseOptions): Result<never> {
    return this._typeIssueFactory(input, options);
  }
}
