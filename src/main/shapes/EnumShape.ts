import { Shape } from './Shape';
import { ApplyResult, Message, ParserOptions, Primitive, TypeCheckOptions } from '../shared-types';
import { createCheckConfig, raiseIssue } from '../shape-utils';
import { CODE_ENUM, MESSAGE_ENUM } from './constants';

/**
 * The shape that constrains input to one of the primitive values.
 *
 * @template T The type of the allowed values.
 */
export class EnumShape<T extends Primitive> extends Shape<T> {
  private _typeCheckConfig;

  /**
   * Creates a new {@linkcode EnumShape} instance.
   *
   * @param values The list of values allowed for the input.
   * @param options The type constraint options or an issue message.
   */
  constructor(readonly values: readonly T[], options?: TypeCheckOptions | Message) {
    super(false);
    this._typeCheckConfig = createCheckConfig(options, CODE_ENUM, MESSAGE_ENUM, values);
  }

  _apply(input: any, options: ParserOptions): ApplyResult<T> {
    const { _applyChecks } = this;

    if (!this.values.includes(input)) {
      return raiseIssue(this._typeCheckConfig, input);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }
}
