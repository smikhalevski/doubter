import { Shape } from './Shape';
import { InputConstraintOptions, ParserOptions, Primitive } from '../shared-types';
import { isEqual, raiseIfIssues, raiseIssue } from '../utils';
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
   * @param options The constraint options.
   */
  constructor(readonly value: T, protected options?: InputConstraintOptions | string) {
    super(false);
  }

  parse(input: unknown, options?: ParserOptions): T {
    const { value, applyConstraints } = this;

    if (!isEqual(input, value)) {
      raiseIssue(input, CODE_LITERAL, value, this.options, MESSAGE_LITERAL + value);
    }

    if (applyConstraints !== null) {
      raiseIfIssues(applyConstraints(input, options, null));
    }
    return input;
  }
}
