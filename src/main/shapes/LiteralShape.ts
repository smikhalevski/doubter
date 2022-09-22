import { Shape } from './Shape';
import { InputConstraintOptionsOrMessage, ParserOptions, Primitive } from '../shared-types';
import { isEqual, returnOrRaiseIssues, raiseIssue } from '../utils';
import { CODE_LITERAL, MESSAGE_LITERAL } from './constants';

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
   * @param options The constraint options or an issue message.
   */
  constructor(readonly value: T, protected options?: InputConstraintOptionsOrMessage) {
    super(false);
  }

  parse(input: unknown, options?: ParserOptions): T {
    const { value, applyConstraints } = this;

    if (!isEqual(input, value)) {
      return raiseIssue(input, CODE_LITERAL, value, this.options, MESSAGE_LITERAL);
    }
    if (applyConstraints !== null) {
      return returnOrRaiseIssues(input, applyConstraints(input, options, null));
    }
    return input as T;
  }
}
