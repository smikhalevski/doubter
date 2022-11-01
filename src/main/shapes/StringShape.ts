import { Shape } from './Shape';
import { ApplyResult, CheckOptions, Message, ParserOptions, TypeCheckOptions } from '../shared-types';
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
import { isString } from '../lang-utils';

export class StringShape extends Shape<string> {
  private _typeCheckConfig;

  constructor(options?: TypeCheckOptions | Message) {
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
  length(length: number, options?: CheckOptions | Message): this {
    return this.min(length, options).max(length, options);
  }

  /**
   * Constrains the string length to be greater than or equal to the length.
   *
   * @param length The minimum string length.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  min(length: number, options?: CheckOptions | Message): this {
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
  max(length: number, options?: CheckOptions | Message): this {
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
  regex(re: RegExp, options?: CheckOptions | Message): this {
    const checkConfig = createCheckConfig(options, CODE_STRING_REGEX, MESSAGE_STRING_REGEX, re);

    return addCheck(this, CODE_STRING_REGEX, options, input => {
      re.lastIndex = 0;

      if (!re.test(input)) {
        return raiseIssue(checkConfig, input);
      }
    });
  }

  _apply(input: unknown, options: ParserOptions): ApplyResult<string> {
    const { _applyChecks } = this;

    if (!isString(input)) {
      return raiseIssue(this._typeCheckConfig, input);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }
}
