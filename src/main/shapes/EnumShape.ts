import { Shape, ValueType } from './Shape';
import { ApplyResult, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { createIssueFactory, getValueType, isUnique } from '../utils';
import { CODE_ENUM, MESSAGE_ENUM } from '../constants';

/**
 * The shape that constrains an input to one of values.
 *
 * @template T Allowed values.
 */
export class EnumShape<T> extends Shape<T> {
  /**
   * The list of values allowed for the input.
   */
  readonly values: readonly T[];

  protected _issueFactory;

  /**
   * Creates a new {@linkcode EnumShape} instance.
   *
   * @param values The list of values allowed for the input.
   * @param options The type constraint options or an issue message.
   */
  constructor(values: readonly T[], options?: TypeConstraintOptions | Message) {
    super();

    this.values = values.filter(isUnique);

    this._issueFactory = createIssueFactory(CODE_ENUM, MESSAGE_ENUM, options, values);
  }

  protected _getInputTypes(): ValueType[] {
    return this.values.map(getValueType);
  }

  protected _apply(input: any, options: ParseOptions): ApplyResult<T> {
    const { _applyChecks } = this;

    if (!this.values.includes(input)) {
      return this._issueFactory(input, options);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }
}
