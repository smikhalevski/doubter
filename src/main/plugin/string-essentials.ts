/**
 * The plugin that enhances {@link core!StringShape StringShape} with additional methods.
 *
 * ```ts
 * import * as d from 'doubter/core';
 * import 'doubter/plugin/string-essentials';
 *
 * d.string().min(5);
 * ```
 *
 * @module plugin/string-essentials
 */

import {
  CODE_STRING_ENDS_WITH,
  CODE_STRING_INCLUDES,
  CODE_STRING_MAX,
  CODE_STRING_MIN,
  CODE_STRING_NON_BLANK,
  CODE_STRING_REGEX,
  CODE_STRING_STARTS_WITH,
  MESSAGE_STRING_ENDS_WITH,
  MESSAGE_STRING_INCLUDES,
  MESSAGE_STRING_MAX,
  MESSAGE_STRING_MIN,
  MESSAGE_STRING_NON_BLANK,
  MESSAGE_STRING_REGEX,
  MESSAGE_STRING_STARTS_WITH,
} from '../constants.ts';
import { StringShape } from '../shape/StringShape.ts';
import { IssueOptions, Message } from '../types.ts';
import { createIssue } from '../utils.ts';

declare module '../core' {
  export interface StringShape {
    /**
     * The shortcut to apply both {@link StringShape.min} and {@link StringShape.max} constraints.
     *
     * @param length The exact length a string must have.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/string-essentials! plugin/string-essentials}
     */
    length(length: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the string length to be greater than or equal to the length.
     *
     * @param length The minimum string length.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/string-essentials! plugin/string-essentials}
     */
    min(length: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the string length to be less than or equal to the length.
     *
     * @param length The maximum string length.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/string-essentials! plugin/string-essentials}
     */
    max(length: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the string to match a regexp.
     *
     * @param re The regular expression that the sting must conform.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/string-essentials! plugin/string-essentials}
     */
    regex(re: RegExp, options?: IssueOptions | Message): this;

    /**
     * Checks that the string includes a substring.
     *
     * @param value The substring to look for.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/string-essentials! plugin/string-essentials}
     */
    includes(value: string, options?: IssueOptions | Message): this;

    /**
     * Checks that the string starts with a substring.
     *
     * @param value The substring to look for.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/string-essentials! plugin/string-essentials}
     */
    startsWith(value: string, options?: IssueOptions | Message): this;

    /**
     * Checks that the string ends with a substring.
     *
     * @param value The substring to look for.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/string-essentials! plugin/string-essentials}
     */
    endsWith(value: string, options?: IssueOptions | Message): this;

    /**
     * Checks that the string doesn't consist of whitespace characters only.
     *
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/string-essentials! plugin/string-essentials}
     */
    nonBlank(options?: IssueOptions | Message): this;

    /**
     * Checks that the string has at least one character.
     *
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/string-essentials! plugin/string-essentials}
     */
    nonEmpty(options?: IssueOptions | Message): this;

    /**
     * Trims the output string.
     *
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/string-essentials! plugin/string-essentials}
     */
    trim(): this;

    /**
     * Converts string to lower case.
     *
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/string-essentials! plugin/string-essentials}
     */
    toLowerCase(): this;

    /**
     * Converts string to upper case.
     *
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/string-essentials! plugin/string-essentials}
     */
    toUpperCase(): this;
  }
}

StringShape.prototype.length = function (length, issueOptions) {
  return this.min(length, issueOptions).max(length, issueOptions);
};

StringShape.prototype.min = function (length, issueOptions) {
  return this.addOperation(
    (value, param, options) => {
      if (value.length >= param) {
        return null;
      }
      return [createIssue(CODE_STRING_MIN, value, MESSAGE_STRING_MIN, param, options, issueOptions)];
    },
    { type: CODE_STRING_MIN, param: length }
  );
};

StringShape.prototype.max = function (length, issueOptions) {
  return this.addOperation(
    (value, param, options) => {
      if (value.length <= param) {
        return null;
      }
      return [createIssue(CODE_STRING_MAX, value, MESSAGE_STRING_MAX, param, options, issueOptions)];
    },
    { type: CODE_STRING_MAX, param: length }
  );
};

StringShape.prototype.regex = function (re, issueOptions) {
  return this.addOperation(
    (value, param, options) => {
      if (param.test(value)) {
        return null;
      }
      return [createIssue(CODE_STRING_REGEX, value, MESSAGE_STRING_REGEX, param, options, issueOptions)];
    },
    { type: CODE_STRING_REGEX, param: re }
  );
};

StringShape.prototype.includes = function (value, issueOptions) {
  return this.addOperation(
    (value, param, options) => {
      if (value.includes(param)) {
        return null;
      }
      return [createIssue(CODE_STRING_INCLUDES, value, MESSAGE_STRING_INCLUDES, param, options, issueOptions)];
    },
    { type: CODE_STRING_INCLUDES, param: value }
  );
};

StringShape.prototype.startsWith = function (value, issueOptions) {
  return this.addOperation(
    (value, param, options) => {
      if (value.startsWith(param)) {
        return null;
      }
      return [createIssue(CODE_STRING_STARTS_WITH, value, MESSAGE_STRING_STARTS_WITH, param, options, issueOptions)];
    },
    { type: CODE_STRING_STARTS_WITH, param: value }
  );
};

StringShape.prototype.endsWith = function (value, issueOptions) {
  return this.addOperation(
    (value, param, options) => {
      if (value.endsWith(param)) {
        return null;
      }
      return [createIssue(CODE_STRING_ENDS_WITH, value, MESSAGE_STRING_ENDS_WITH, param, options, issueOptions)];
    },
    { type: CODE_STRING_ENDS_WITH, param: value }
  );
};

StringShape.prototype.nonBlank = function (issueOptions) {
  return this.addOperation(
    (value, param, options) => {
      if (value.trim().length !== 0) {
        return null;
      }
      return [createIssue(CODE_STRING_NON_BLANK, value, MESSAGE_STRING_NON_BLANK, param, options, issueOptions)];
    },
    { type: CODE_STRING_NON_BLANK }
  );
};

StringShape.prototype.nonEmpty = function (issueOptions) {
  return this.min(1, issueOptions);
};

StringShape.prototype.trim = function () {
  return this.addOperation(
    (value, _param, _options) => {
      return { ok: true, value: value.trim() };
    },
    { type: 'string.trim' }
  );
};

StringShape.prototype.toLowerCase = function () {
  return this.addOperation(
    (value, _param, _options) => {
      return { ok: true, value: value.toLowerCase() };
    },
    { type: 'string.toLowerCase' }
  );
};

StringShape.prototype.toUpperCase = function () {
  return this.addOperation(
    (value, _param, _options) => {
      return { ok: true, value: value.toUpperCase() };
    },
    { type: 'string.toUpperCase' }
  );
};
