import { CODE_TYPE_NEVER } from '../constants';
import { neverInputs } from '../types';
import { ApplyOptions, IssueOptions, Message, Result } from '../typings';
import { createIssueFactory } from '../utils';
import { Shape } from './Shape';

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
   * Creates a new {@link NeverShape} instance.
   *
   * @param options The issue options or the issue message.
   */
  constructor(options?: IssueOptions | Message) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_TYPE_NEVER, Shape.messages[CODE_TYPE_NEVER], options, undefined);
  }

  protected _getInputs(): readonly unknown[] {
    return neverInputs;
  }

  protected _apply(input: unknown, options: ApplyOptions, nonce: number): Result<never> {
    return [this._typeIssueFactory(input, options)];
  }
}
