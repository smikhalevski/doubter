import { Shape } from './Shape';
import { InputConstraintOptionsOrMessage, ParserOptions, Primitive } from '../shared-types';
import { raiseIssue, returnValueOrRaiseIssues } from '../utils';
import { CODE_LITERAL, MESSAGE_LITERAL } from '../v3/shapes/constants';
import { ValidationError } from '../ValidationError';
import { isEqual } from '../lang-utils';

/**
 * The shape that requires an input to be equal to the literal value
 *
 * @template T The literal value.
 */
export class LiteralShape<T extends Primitive> extends Shape<T> {
  /**
   * Creates a new {@linkcode LiteralShape} instance.
   *
   * @param value The literal value that is compared with the input value.
   * @param _options The constraint options or an issue message.
   */
  constructor(readonly value: T, protected _options?: InputConstraintOptionsOrMessage) {
    super(false);
  }

  safeParse(input: unknown, options?: ParserOptions): T | ValidationError {
    const { value, _applyConstraints } = this;

    if (!isEqual(input, value)) {
      return raiseIssue(input, CODE_LITERAL, value, this._options, MESSAGE_LITERAL);
    }
    if (_applyConstraints !== null) {
      return returnValueOrRaiseIssues(input as T, _applyConstraints(input, options, null));
    }
    return input as T;
  }
}
