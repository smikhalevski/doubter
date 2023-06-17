import { CODE_CONST, MESSAGE_CONST } from '../constants';
import { createIssueFactory } from '../helpers';
import { ApplyOptions, ConstraintOptions, Message } from '../types';
import { Result, Shape } from './Shape';

/**
 * The shape of a constant value.
 *
 * @template Value The expected constant value.
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
   * Creates a new {@linkcode ConstShape} instance.
   *
   * @param value The expected value.
   * @param options The type constraint options or an issue message.
   * @template Value The expected value.
   */
  constructor(
    /**
     * The expected constant value.
     */
    readonly value: Value,
    options?: ConstraintOptions | Message
  ) {
    super();

    this._typePredicate = value !== value ? Number.isNaN : input => value === input;
    this._typeIssueFactory = createIssueFactory(CODE_CONST, MESSAGE_CONST, options, value);
  }

  protected _getInputs(): unknown[] {
    return [this.value];
  }

  protected _apply(input: unknown, options: ApplyOptions, nonce: number): Result<Value> {
    const { _applyChecks } = this;

    if (!this._typePredicate(input)) {
      return this._typeIssueFactory(input, options);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }
}
