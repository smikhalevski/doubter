import { CODE_TYPE_CONST } from '../constants';
import { ApplyOptions, IssueOptions, Message, Result } from '../types';
import { createIssueFactory } from '../utils';
import { Shape } from './Shape';

/**
 * The shape of a constant value.
 *
 * @template Value The expected constant value.
 * @group Shapes
 */
export class ConstShape<Value> extends Shape<Value> {
  /**
   * Returns `true` if an input is equal to the const value, or `false` otherwise.
   */
  protected _typePredicate: (input: unknown) => boolean;

  /**
   * Returns issues associated with an invalid input value type.
   */
  protected _typeIssueFactory;

  /**
   * Creates a new {@link ConstShape} instance.
   *
   * @param value The expected value.
   * @param options The issue options or the issue message.
   * @template Value The expected value.
   */
  constructor(
    /**
     * The expected constant value.
     */
    readonly value: Value,
    options?: IssueOptions | Message
  ) {
    super();

    this._typePredicate = value !== value ? Number.isNaN : input => value === input;
    this._typeIssueFactory = createIssueFactory(CODE_TYPE_CONST, Shape.messages['type.const'], options, value);
  }

  protected _getInputs(): unknown[] {
    return [this.value];
  }

  protected _apply(input: unknown, options: ApplyOptions, nonce: number): Result<Value> {
    if (!this._typePredicate(input)) {
      return [this._typeIssueFactory(input, options)];
    }
    return this._applyOperations(input, input, options, null);
  }
}
