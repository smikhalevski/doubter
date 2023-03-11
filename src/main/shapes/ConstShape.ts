import { CODE_CONST, MESSAGE_CONST } from '../constants';
import { ApplyOptions, ConstraintOptions, Message } from '../types';
import { createIssueFactory } from '../utils';
import { Result, Shape } from './Shape';

/**
 * The shape that constrains an input to be exactly equal to the expected value.
 *
 * @template T The expected value.
 */
export class ConstShape<T> extends Shape<T> {
  protected _typePredicate: (input: unknown) => boolean;
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode ConstShape} instance.
   *
   * @param value The expected value.
   * @param options The type constraint options or an issue message.
   * @template T The expected value.
   */
  constructor(
    /**
     * The expected value.
     */
    readonly value: T,
    options?: ConstraintOptions | Message
  ) {
    super();

    this._typePredicate = value !== value ? Number.isNaN : input => value === input;
    this._typeIssueFactory = createIssueFactory(CODE_CONST, MESSAGE_CONST, options, value);
  }

  protected _getInputTypes(): unknown[] {
    return [this.value];
  }

  protected _apply(input: unknown, options: ApplyOptions): Result<T> {
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
