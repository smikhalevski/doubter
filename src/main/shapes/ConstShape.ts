import { Shape, ValueType } from './Shape';
import { ApplyResult, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { createIssueFactory, getValueType, isNaN } from '../utils';
import { CODE_CONST, MESSAGE_CONST } from '../constants';

/**
 * The shape that constrains an input to be the exact value.
 *
 * @template T The value.
 */
export class ConstShape<T> extends Shape<T> {
  protected _typeIssueFactory;
  protected _typePredicate: (input: unknown) => boolean;

  /**
   * Creates a new {@linkcode ConstShape} instance.
   *
   * @param value The exact value.
   * @param options The type constraint options or an issue message.
   * @template T Allowed values.
   */
  constructor(readonly value: T, options?: TypeConstraintOptions | Message) {
    super();

    this._typePredicate = value !== value ? isNaN : input => value === input;
    this._typeIssueFactory = createIssueFactory(CODE_CONST, MESSAGE_CONST, options, value);
  }

  protected _getInputTypes(): ValueType[] {
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
