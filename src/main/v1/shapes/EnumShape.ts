import { InputConstraintOptions, ParserOptions, Primitive } from '../shared-types';
import { Shape } from './Shape';
import { raiseIfIssues, raiseIssue } from '../utils';
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
   * @param options The constraint options.
   */
  constructor(readonly values: readonly T[], protected options?: InputConstraintOptions | string) {
    super(false);
  }

  parse(input: any, options?: ParserOptions): T {
    const { values, applyConstraints } = this;

    if (!values.includes(input)) {
      raiseIssue(input, CODE_ENUM, values, this.options, MESSAGE_ENUM + values.join(', '));
    }

    if (applyConstraints !== null) {
      raiseIfIssues(applyConstraints(input, options, null));
    }
    return input;
  }
}
