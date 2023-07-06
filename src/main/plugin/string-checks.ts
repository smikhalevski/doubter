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
  CODE_STRING_BLANK,
  CODE_STRING_ENDS_WITH,
  CODE_STRING_INCLUDES,
  CODE_STRING_MAX,
  CODE_STRING_MIN,
  CODE_STRING_REGEX,
  CODE_STRING_STARTS_WITH,
  MESSAGE_STRING_BLANK,
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
     * Checks that the string doesn't consist of whitespace characters only.
     *
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/string-checks!}
     */
    nonBlank(options?: IssueOptions | Message): this;

    /**
     * Checks that the string has at least one character.
     *
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/string-checks!}
     */
    nonEmpty(options?: IssueOptions | Message): this;

    /**
     * Trims the output string.
     *
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/string-checks!}
     */
    trim(): this;

    /**
     * Converts string to lowercase.
     *
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/string-checks!}
     */
    toLowerCase(): this;

    /**
     * Converts string to uppercase.
     *
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/string-checks!}
     */
    toUpperCase(): this;
  }
}

/**
 * Enhances {@linkcode doubter/core!StringShape} with additional checks.
 */
export default function () {
  StringShape.prototype.length = lengthCheck;
  StringShape.prototype.min = minCheck;
  StringShape.prototype.max = maxCheck;
  StringShape.prototype.regex = regexCheck;
  StringShape.prototype.includes = includesCheck;
  StringShape.prototype.startsWith = startsWithCheck;
  StringShape.prototype.endsWith = endsWithCheck;
  StringShape.prototype.nonBlank = nonBlankCheck;
  StringShape.prototype.nonEmpty = nonEmptyCheck;
  StringShape.prototype.trim = trimOperation;
  StringShape.prototype.toLowerCase = toLowerCaseOperation;
  StringShape.prototype.toUpperCase = toUpperCaseOperation;
}

function lengthCheck(this: StringShape, length: number, options?: IssueOptions | Message): StringShape {
  return this.min(length, options).max(length, options);
}

function minCheck(this: StringShape, length: number, options?: IssueOptions | Message): StringShape {
  const issueFactory = createIssueFactory(CODE_STRING_MIN, MESSAGE_STRING_MIN, options, length);

  return this.addOperation({
    type: CODE_STRING_MIN,
    param: length,
    compose: next => (input, output, options, issues) => {
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

function maxCheck(this: StringShape, length: number, options?: IssueOptions | Message): StringShape {
  const issueFactory = createIssueFactory(CODE_STRING_MAX, MESSAGE_STRING_MAX, options, length);

  return this.addOperation({
    type: CODE_STRING_MAX,
    param: length,
    compose: next => (input, output, options, issues) => {
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

function regexCheck(this: StringShape, re: RegExp, options?: IssueOptions | Message): StringShape {
  const issueFactory = createIssueFactory(CODE_STRING_REGEX, MESSAGE_STRING_REGEX, options, re);

  return this.addOperation({
    type: CODE_STRING_REGEX,
    param: re,
    compose: next => (input, output, options, issues) => {
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

function includesCheck(this: StringShape, value: string, options?: IssueOptions | Message): StringShape {
  const issueFactory = createIssueFactory(CODE_STRING_INCLUDES, MESSAGE_STRING_INCLUDES, options, value);

  return this.addOperation({
    type: CODE_STRING_INCLUDES,
    param: value,
    compose: next => (input, output, options, issues) => {
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

function startsWithCheck(this: StringShape, value: string, options?: IssueOptions | Message): StringShape {
  const issueFactory = createIssueFactory(CODE_STRING_STARTS_WITH, MESSAGE_STRING_STARTS_WITH, options, value);

  return this.addOperation({
    type: CODE_STRING_STARTS_WITH,
    param: value,
    compose: next => (input, output, options, issues) => {
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

function endsWithCheck(this: StringShape, value: string, options?: IssueOptions | Message): StringShape {
  const issueFactory = createIssueFactory(CODE_STRING_ENDS_WITH, MESSAGE_STRING_ENDS_WITH, options, value);

  return this.addOperation({
    type: CODE_STRING_ENDS_WITH,
    param: value,
    compose: next => (input, output, options, issues) => {
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

function nonBlankCheck(this: StringShape, options?: IssueOptions | Message): StringShape {
  const issueFactory = createIssueFactory(CODE_STRING_BLANK, MESSAGE_STRING_BLANK, options, undefined);

  return this.addOperation({
    type: CODE_STRING_BLANK,
    param: undefined,
    compose: next => (input, output, options, issues) => {
      if (output.trim().length === 0) {
        issues = pushIssue(issues, issueFactory(output, options));

        if (!options.verbose) {
          return issues;
        }
      }
      return next(input, output, options, issues);
    },
  });
}

function nonEmptyCheck(this: StringShape, options?: IssueOptions | Message): StringShape {
  return this.min(1, options);
}

function trimOperation(this: StringShape): StringShape {
  return this.addOperation({
    type: 'trim',
    param: undefined,
    compose: next => (input, output, options, issues) => next(input, output.trim(), options, issues),
  });
}

function toLowerCaseOperation(this: StringShape): StringShape {
  return this.addOperation({
    type: 'to_lower_case',
    param: undefined,
    compose: next => (input, output, options, issues) => next(input, output.toLowerCase(), options, issues),
  });
}

function toUpperCaseOperation(this: StringShape): StringShape {
  return this.addOperation({
    type: 'to_upper_case',
    param: undefined,
    compose: next => (input, output, options, issues) => next(input, output.toUpperCase(), options, issues),
  });
}
