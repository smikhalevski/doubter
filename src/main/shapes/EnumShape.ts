import { Shape } from './Shape';
import { ApplyResult, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { createIssueFactory } from '../utils';
import { CODE_ENUM, MESSAGE_ENUM } from '../constants';

/**
 * The shape that constrains an input to one of values.
 *
 * @template T Allowed values.
 */
export class EnumShape<T> extends Shape<T> {
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode EnumShape} instance.
   *
   * @param values The list of values allowed for the input.
   * @param options The type constraint options or an issue message.
   */
  constructor(readonly values: readonly T[], options?: TypeConstraintOptions | Message) {
    super(values.map(Shape.typeof));

    this._typeIssueFactory = createIssueFactory(CODE_ENUM, MESSAGE_ENUM, options, values);
  }

  apply(input: any, options: ParseOptions): ApplyResult<T> {
    const { _applyChecks } = this;

    if (!this.values.includes(input)) {
      return [this._typeIssueFactory(input, options)];
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }
}
