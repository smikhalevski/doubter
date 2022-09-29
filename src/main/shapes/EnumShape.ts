import { InputConstraintOptionsOrMessage, ParserOptions, Primitive } from '../shared-types';
import { Shape } from './Shape';
import { raiseIssue, returnValueOrRaiseIssues } from '../utils';
import { CODE_ENUM, MESSAGE_ENUM } from './constants';
import { ValidationError } from '../ValidationError';

/**
 * The shape that constrains input to one of the primitive values.
 *
 * @template T The type of the allowed values.
 */
export class EnumShape<T extends Primitive> extends Shape<T> {
  /**
   * Creates a new {@linkcode EnumShape} instance.
   *
   * @param values The list of values allowed for the input.
   * @param _options The constraint options or an issue message.
   */
  constructor(readonly values: readonly T[], protected _options?: InputConstraintOptionsOrMessage) {
    super(false);
  }

  safeParse(input: any, options?: ParserOptions): T | ValidationError {
    const { values, _applyConstraints } = this;

    if (!values.includes(input)) {
      return raiseIssue(input, CODE_ENUM, values, this._options, MESSAGE_ENUM);
    }
    if (_applyConstraints !== null) {
      return returnValueOrRaiseIssues(input, _applyConstraints(input, options, null));
    }
    return input;
  }
}
