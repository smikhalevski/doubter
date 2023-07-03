/**
 * The plugin that enhances {@linkcode doubter/core!StringShape} with additional checks.
 *
 * ```ts
 * import stringChecks from 'doubter/plugin/string-checks';
 *
 * stringChecks();
 * ```
 *
 * @module doubter/plugin/string-checks
 */

import {
  CODE_STRING_ENDS_WITH,
  CODE_STRING_INCLUDES,
  CODE_STRING_MAX,
  CODE_STRING_MIN,
  CODE_STRING_REGEX,
  CODE_STRING_STARTS_WITH,
  MESSAGE_STRING_ENDS_WITH,
  MESSAGE_STRING_INCLUDES,
  MESSAGE_STRING_MAX,
  MESSAGE_STRING_MIN,
  MESSAGE_STRING_REGEX,
  MESSAGE_STRING_STARTS_WITH,
} from '../constants';
import { IssueOptions, Message, StringShape } from '../core';
import { pushIssue } from '../internal';
import { createIssueFactory } from '../utils';

declare module '../core' {
  export interface StringShape {
    /**
     * The minimum length, or `undefined` if there's no minimum length.
     *
     * @group Plugin Properties
     * @plugin {@link doubter/plugin/string-checks!}
     */
    readonly minLength: number | undefined;

    /**
     * The maximum length, or `undefined` if there's no maximum length.
     *
     * @group Plugin Properties
     * @plugin {@link doubter/plugin/string-checks!}
     */
    readonly maxLength: number | undefined;

    /**
     * The pattern that the string should match set via {@linkcode regex}, or `undefined` if there's no pattern.
     *
     * @group Plugin Properties
     * @plugin {@link doubter/plugin/string-checks!}
     */
    readonly pattern: RegExp | undefined;

    /**
     * The shortcut to apply both {@linkcode min} and {@linkcode max} constraints.
     *
     * @param length The exact length a string must have.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/string-checks!}
     */
    length(length: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the string length to be greater than or equal to the length.
     *
     * @param length The minimum string length.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/string-checks!}
     */
    min(length: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the string length to be less than or equal to the length.
     *
     * @param length The maximum string length.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/string-checks!}
     */
    max(length: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the string to match a regexp.
     *
     * @param re The regular expression that the sting must conform.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/string-checks!}
     */
    regex(re: RegExp, options?: IssueOptions | Message): this;

    /**
     * Checks that the string includes a substring.
     *
     * @param value The substring to look for.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/string-checks!}
     */
    includes(value: string, options?: IssueOptions | Message): this;

    /**
     * Checks that the string starts with a substring.
     *
     * @param value The substring to look for.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/string-checks!}
     */
    startsWith(value: string, options?: IssueOptions | Message): this;

    /**
     * Checks that the string ends with a substring.
     *
     * @param value The substring to look for.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/string-checks!}
     */
    endsWith(value: string, options?: IssueOptions | Message): this;

    /**
     * Trims the output string.
     *
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/string-checks!}
     */
    trim(): this;
  }
}

/**
 * Enhances {@linkcode doubter/core!StringShape} with additional checks.
 */
export default function () {
  StringShape.prototype.length = appendLengthCheck;
  StringShape.prototype.min = appendMinCheck;
  StringShape.prototype.max = appendMaxCheck;
  StringShape.prototype.regex = appendRegexCheck;
  StringShape.prototype.includes = appendIncludesCheck;
  StringShape.prototype.startsWith = appendStartsWithCheck;
  StringShape.prototype.endsWith = appendEndsWithCheck;
  StringShape.prototype.trim = appendTrimAlter;
}

function appendLengthCheck(this: StringShape, length: number, options?: IssueOptions | Message): StringShape {
  return this.min(length, options).max(length, options);
}

function appendMinCheck(this: StringShape, length: number, options?: IssueOptions | Message): StringShape {
  const issueFactory = createIssueFactory(CODE_STRING_MIN, MESSAGE_STRING_MIN, options, length);

  return this._appendOperation({
    type: CODE_STRING_MIN,
    param: length,
    compile: next => (input, output, options, issues) => {
      if (output.length < length) {
        issues = pushIssue(issues, issueFactory(output, options));

        if (!options.verbose) {
          return issues;
        }
      }
      return next(input, output, options, issues);
    },
  });
}

function appendMaxCheck(this: StringShape, length: number, options?: IssueOptions | Message): StringShape {
  const issueFactory = createIssueFactory(CODE_STRING_MAX, MESSAGE_STRING_MAX, options, length);

  return this._appendOperation({
    type: CODE_STRING_MAX,
    param: length,
    compile: next => (input, output, options, issues) => {
      if (output.length > length) {
        issues = pushIssue(issues, issueFactory(output, options));

        if (!options.verbose) {
          return issues;
        }
      }
      return next(input, output, options, issues);
    },
  });
}

function appendRegexCheck(this: StringShape, re: RegExp, options?: IssueOptions | Message): StringShape {
  const issueFactory = createIssueFactory(CODE_STRING_REGEX, MESSAGE_STRING_REGEX, options, re);

  return this._appendOperation({
    type: CODE_STRING_REGEX,
    param: re,
    compile: next => (input, output, options, issues) => {
      if (!re.test(output)) {
        issues = pushIssue(issues, issueFactory(output, options));

        if (!options.verbose) {
          return issues;
        }
      }
      return next(input, output, options, issues);
    },
  });
}

function appendIncludesCheck(this: StringShape, value: string, options?: IssueOptions | Message): StringShape {
  const issueFactory = createIssueFactory(CODE_STRING_INCLUDES, MESSAGE_STRING_INCLUDES, options, value);

  return this._appendOperation({
    type: CODE_STRING_INCLUDES,
    param: value,
    compile: next => (input, output, options, issues) => {
      if (output.indexOf(value) === -1) {
        issues = pushIssue(issues, issueFactory(output, options));

        if (!options.verbose) {
          return issues;
        }
      }
      return next(input, output, options, issues);
    },
  });
}

function appendStartsWithCheck(this: StringShape, value: string, options?: IssueOptions | Message): StringShape {
  const issueFactory = createIssueFactory(CODE_STRING_STARTS_WITH, MESSAGE_STRING_STARTS_WITH, options, value);

  return this._appendOperation({
    type: CODE_STRING_STARTS_WITH,
    param: value,
    compile: next => (input, output, options, issues) => {
      if (!output.startsWith(value)) {
        issues = pushIssue(issues, issueFactory(output, options));

        if (!options.verbose) {
          return issues;
        }
      }
      return next(input, output, options, issues);
    },
  });
}

function appendEndsWithCheck(this: StringShape, value: string, options?: IssueOptions | Message): StringShape {
  const issueFactory = createIssueFactory(CODE_STRING_ENDS_WITH, MESSAGE_STRING_ENDS_WITH, options, value);

  return this._appendOperation({
    type: CODE_STRING_ENDS_WITH,
    param: value,
    compile: next => (input, output, options, issues) => {
      if (!output.endsWith(value)) {
        issues = pushIssue(issues, issueFactory(output, options));

        if (!options.verbose) {
          return issues;
        }
      }
      return next(input, output, options, issues);
    },
  });
}

function appendTrimAlter(this: StringShape): StringShape {
  return this._appendOperation({
    type: 'trim',
    param: undefined,
    compile: next => (input, output, options, issues) => next(input, output.trim(), options, issues),
  });
}
