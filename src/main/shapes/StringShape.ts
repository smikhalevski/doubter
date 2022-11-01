import { InputConstraintOptionsOrMessage, OutputConstraintOptionsOrMessage, ParserOptions } from '../shared-types';
import { Shape } from './Shape';
import { appendConstraint, createIssue, raiseIssue, returnValueOrRaiseIssues } from '../utils';
import {
  CODE_STRING_MAX,
  CODE_STRING_MIN,
  CODE_STRING_REGEX,
  CODE_TYPE,
  MESSAGE_STRING_MAX,
  MESSAGE_STRING_MIN,
  MESSAGE_STRING_REGEX,
  MESSAGE_STRING_TYPE,
  TYPE_STRING,
} from '../v3/shapes/constants';
import { ValidationError } from '../ValidationError';

export class StringShape extends Shape<string> {
  constructor(protected _options?: InputConstraintOptionsOrMessage) {
    super(false);
  }

  /**
   * The shortcut to apply both {@linkcode min} and {@linkcode max} constraints.
   *
   * @param length The exact length a string must have.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  length(length: number, options?: OutputConstraintOptionsOrMessage): this {
    return this.min(length, options).max(length, options);
  }

  /**
   * Constrains the string length to be greater than or equal to the length.
   *
   * @param length The minimum string length.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  min(length: number, options?: OutputConstraintOptionsOrMessage): this {
    return appendConstraint(this, CODE_STRING_MIN, options, input => {
      if (input.length < length) {
        return createIssue(input, CODE_STRING_MIN, length, options, MESSAGE_STRING_MIN);
      }
    });
  }

  /**
   * Constrains the string length to be less than or equal to the length.
   *
   * @param length The maximum string length.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  max(length: number, options?: OutputConstraintOptionsOrMessage): this {
    return appendConstraint(this, CODE_STRING_MAX, options, output => {
      if (output.length > length) {
        return createIssue(output, CODE_STRING_MAX, length, options, MESSAGE_STRING_MAX);
      }
    });
  }

  /**
   * Constrains the string to match a regexp.
   *
   * @param re The regular expression that the sting must conform.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  regex(re: RegExp, options?: OutputConstraintOptionsOrMessage): this {
    return appendConstraint(this, CODE_STRING_REGEX, options, output => {
      re.lastIndex = 0;

      if (!re.test(output)) {
        return createIssue(output, CODE_STRING_REGEX, re, options, MESSAGE_STRING_REGEX);
      }
    });
  }

  safeParse(input: unknown, options?: ParserOptions): string | ValidationError {
    const { _applyConstraints } = this;

    if (typeof input !== 'string') {
      return raiseIssue(input, CODE_TYPE, TYPE_STRING, this._options, MESSAGE_STRING_TYPE);
    }
    if (_applyConstraints !== null) {
      return returnValueOrRaiseIssues(input, _applyConstraints(input, options, null));
    }
    return input;
  }
}
