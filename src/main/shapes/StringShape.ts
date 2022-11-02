import { Shape } from './Shape';
import { ApplyResult, ConstraintOptions, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { addCheck, createCheckConfig, raiseIssue } from '../shape-utils';
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
} from './constants';

/**
 * The shape that constrains the input as a string.
 */
export class StringShape extends Shape<string> {
  protected _typeCheckConfig;

  /**
   * Creates a new {@linkcode StringShape} instance.
   *
   * @param options The type constraint options or the type issue message.
   */
  constructor(options?: TypeConstraintOptions | Message) {
    super(false);
    this._typeCheckConfig = createCheckConfig(options, CODE_TYPE, MESSAGE_STRING_TYPE, TYPE_STRING);
  }

  /**
   * The shortcut to apply both {@linkcode min} and {@linkcode max} constraints.
   *
   * @param length The exact length a string must have.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  length(length: number, options?: ConstraintOptions | Message): this {
    return this.min(length, options).max(length, options);
  }

  /**
   * Constrains the string length to be greater than or equal to the length.
   *
   * @param length The minimum string length.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  min(length: number, options?: ConstraintOptions | Message): this {
    const checkConfig = createCheckConfig(options, CODE_STRING_MIN, MESSAGE_STRING_MIN, length);

    return addCheck(this, CODE_STRING_MIN, options, input => {
      if (input.length < length) {
        return raiseIssue(checkConfig, input);
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
  max(length: number, options?: ConstraintOptions | Message): this {
    const checkConfig = createCheckConfig(options, CODE_STRING_MAX, MESSAGE_STRING_MAX, length);

    return addCheck(this, CODE_STRING_MAX, options, input => {
      if (input.length > length) {
        return raiseIssue(checkConfig, input);
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
  regex(re: RegExp, options?: ConstraintOptions | Message): this {
    const checkConfig = createCheckConfig(options, CODE_STRING_REGEX, MESSAGE_STRING_REGEX, re);

    return addCheck(this, CODE_STRING_REGEX, options, input => {
      re.lastIndex = 0;

      if (!re.test(input)) {
        return raiseIssue(checkConfig, input);
      }
    });
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<string> {
    const { applyChecks } = this;

    if (typeof input !== 'string') {
      return raiseIssue(this._typeCheckConfig, input);
    }
    if (applyChecks !== null) {
      return applyChecks(input, null, options);
    }
    return null;
  }
}
