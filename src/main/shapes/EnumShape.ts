import { InputConstraintOptionsOrMessage, ParserOptions, Primitive } from '../shared-types';
import { Shape } from './Shape';
import { returnOrRaiseIssues, raiseIssue } from '../utils';
import { CODE_ENUM, MESSAGE_ENUM } from './constants';

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
   * @param options The constraint options or an issue message.
   */
  constructor(readonly values: readonly T[], protected options?: InputConstraintOptionsOrMessage) {
    super(false);
  }

  parse(input: any, options?: ParserOptions): T {
    const { values, applyConstraints } = this;

    if (!values.includes(input)) {
      return raiseIssue(input, CODE_ENUM, values, this.options, MESSAGE_ENUM);
    }
    if (applyConstraints !== null) {
      return returnOrRaiseIssues(input, applyConstraints(input, options, null));
    }
    return input;
  }
}
