import { Shape } from './Shape';
import { ApplyResult, Message, ParserOptions, Primitive, TypeCheckOptions } from '../shared-types';
import { createCheckConfig, raiseIssue } from '../shape-utils';
import { CODE_LITERAL, MESSAGE_LITERAL } from './constants';
import { isEqual } from '../lang-utils';

/**
 * The shape that requires an input to be equal to the literal value
 *
 * @template T The literal value.
 */
export class LiteralShape<T extends Primitive> extends Shape<T> {
  protected _typeCheckConfig;

  /**
   * Creates a new {@linkcode LiteralShape} instance.
   *
   * @param value The literal value that is compared with the input value.
   * @param options The type constraint options or an issue message.
   */
  constructor(readonly value: T, options?: TypeCheckOptions | Message) {
    super(false);
    this._typeCheckConfig = createCheckConfig(options, CODE_LITERAL, MESSAGE_LITERAL, value);
  }

  _apply(input: unknown, options: ParserOptions): ApplyResult<T> {
    const { _applyChecks } = this;

    if (!isEqual(input, this.value)) {
      return raiseIssue(this._typeCheckConfig, input);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }
}
