import { ConstraintOptions, ParserOptions } from '../shared-types';
import { Shape } from './Shape';
import { applyConstraints, raiseOnError, raiseIssue, addConstraint } from '../utils';

export class StringShape extends Shape<string> {
  constructor(protected options?: ConstraintOptions | string) {
    super(false);
  }

  /**
   * Constrains the string length.
   *
   * @param length The exact length a string must have.
   * @param options The constraint options or an issue message.
   * @returns The copy of the shape.
   */
  length(length: number, options?: ConstraintOptions | string): this {
    return this.min(length, options).max(length, options);
  }

  /**
   * Constrains the string length to be greater than or equal to the length.
   *
   * @param length The minimum string length.
   * @param options The constraint options or an issue message.
   * @returns The copy of the shape.
   */
  min(length: number, options?: ConstraintOptions | string): this {
    return addConstraint(this, 'min', input => {
      if (input.length < length) {
        raiseIssue(input, 'stringMinLength', length, options, 'Must have the minimum length of ' + length);
      }
    });
  }

  /**
   * Constrains the string length to be less than or equal to the length.
   *
   * @param length The maximum string length.
   * @param options The constraint options or an issue message.
   * @returns The copy of the shape.
   */
  max(length: number, options?: ConstraintOptions | string): this {
    return addConstraint(this, 'max', output => {
      if (output.length > length) {
        raiseIssue(output, 'stringMaxLength', length, options, 'Must have the maximum length of ' + length);
      }
    });
  }

  /**
   * Constrains the string to match a regexp.
   *
   * @param re The regular expression that the sting must conform.
   * @param options The constraint options or an issue message.
   * @returns The copy of the shape.
   */
  regex(re: RegExp, options?: ConstraintOptions | string): this {
    return addConstraint(this, 'regex', output => {
      if (!re.test(output)) {
        raiseIssue(output, 'stringRegex', re, options, 'Must match the pattern ' + re);
      }
    });
  }

  parse(input: unknown, options?: ParserOptions): string {
    if (typeof input !== 'string') {
      raiseIssue(input, 'type', 'string', this.options, 'Must be a string');
    }

    const { constraints } = this;

    if (constraints !== null) {
      raiseOnError(applyConstraints(input, constraints, options, null));
    }
    return input;
  }
}
