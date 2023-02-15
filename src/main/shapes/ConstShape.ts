import { ApplyResult, Shape, ValueType } from './Shape';
import { ConstraintOptions, Message, ParseOptions } from '../shared-types';
import { createIssueFactory, getValueType } from '../utils';
import { CODE_CONST, MESSAGE_CONST } from '../constants';

/**
 * The shape that constrains an input to exactly equal to the expected value.
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

  protected _getInputTypes(): readonly ValueType[] {
    return [getValueType(this.value)];
  }

  protected _getInputValues(): unknown[] {
    return [this.value];
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<T> {
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
