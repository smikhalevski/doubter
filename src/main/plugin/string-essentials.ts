/**
 * The plugin that enhances {@link core!StringShape StringShape} with additional methods.
 *
 * ```ts
 * import { StringShape } from 'doubter/core';
 * import enableStringEssentials from 'doubter/plugin/string-essentials';
 *
 * enableStringEssentials(StringShape.prototype);
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
} from '../constants';
import { IssueOptions, Message, StringShape } from '../core';
import { Any } from '../types';
import { createIssueFactory } from '../utils';

declare module '../core' {
  export interface Messages {
    'string.nonBlank': Message | Any;
    'string.min': Message | Any;
    'string.max': Message | Any;
    'string.regex': Message | Any;
    'string.includes': Message | Any;
    'string.startsWith': Message | Any;
    'string.endsWith': Message | Any;
  }

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

/**
 * Enhances {@link core!StringShape StringShape} with additional methods.
 */
export default function enableStringEssentials(ctor: typeof StringShape): void {
  const { messages, prototype } = ctor;

  messages[CODE_STRING_NON_BLANK] = 'Must not be blank';
  messages[CODE_STRING_MIN] = 'Must have the minimum length of %s';
  messages[CODE_STRING_MAX] = 'Must have the maximum length of %s';
  messages[CODE_STRING_REGEX] = 'Must match the pattern %s';
  messages[CODE_STRING_INCLUDES] = 'Must include: %s';
  messages[CODE_STRING_STARTS_WITH] = 'Must start with: %s';
  messages[CODE_STRING_ENDS_WITH] = 'Must end with: %s';

  prototype.length = function (length, options) {
    return this.min(length, options).max(length, options);
  };

  prototype.min = function (length, options) {
    const issueFactory = createIssueFactory(CODE_STRING_MIN, ctor.messages[CODE_STRING_MIN], options, length);

    return this.use(
      next => (input, output, options, issues) => {
        if (output.length < length) {
          (issues ||= []).push(issueFactory(output, options));

          if (options.earlyReturn) {
            return issues;
          }
        }
        return next(input, output, options, issues);
      },
      { type: CODE_STRING_MIN, param: length }
    );
  };

  prototype.max = function (length, options) {
    const issueFactory = createIssueFactory(CODE_STRING_MAX, ctor.messages[CODE_STRING_MAX], options, length);

    return this.use(
      next => (input, output, options, issues) => {
        if (output.length > length) {
          (issues ||= []).push(issueFactory(output, options));

          if (options.earlyReturn) {
            return issues;
          }
        }
        return next(input, output, options, issues);
      },
      { type: CODE_STRING_MAX, param: length }
    );
  };

  prototype.regex = function (re, options) {
    const issueFactory = createIssueFactory(CODE_STRING_REGEX, ctor.messages[CODE_STRING_REGEX], options, re);

    return this.use(
      next => (input, output, options, issues) => {
        if (!re.test(output)) {
          (issues ||= []).push(issueFactory(output, options));

          if (options.earlyReturn) {
            return issues;
          }
        }
        return next(input, output, options, issues);
      },
      { type: CODE_STRING_REGEX, param: re }
    );
  };

  prototype.includes = function (value, options) {
    const issueFactory = createIssueFactory(CODE_STRING_INCLUDES, ctor.messages[CODE_STRING_INCLUDES], options, value);

    return this.use(
      next => (input, output, options, issues) => {
        if (output.indexOf(value) === -1) {
          (issues ||= []).push(issueFactory(output, options));

          if (options.earlyReturn) {
            return issues;
          }
        }
        return next(input, output, options, issues);
      },
      { type: CODE_STRING_INCLUDES, param: value }
    );
  };

  prototype.startsWith = function (value, options) {
    const issueFactory = createIssueFactory(
      CODE_STRING_STARTS_WITH,
      ctor.messages[CODE_STRING_STARTS_WITH],
      options,
      value
    );

    return this.use(
      next => (input, output, options, issues) => {
        if (!output.startsWith(value)) {
          (issues ||= []).push(issueFactory(output, options));

          if (options.earlyReturn) {
            return issues;
          }
        }
        return next(input, output, options, issues);
      },
      { type: CODE_STRING_STARTS_WITH, param: value }
    );
  };

  prototype.endsWith = function (value, options) {
    const issueFactory = createIssueFactory(
      CODE_STRING_ENDS_WITH,
      ctor.messages[CODE_STRING_ENDS_WITH],
      options,
      value
    );

    return this.use(
      next => (input, output, options, issues) => {
        if (!output.endsWith(value)) {
          (issues ||= []).push(issueFactory(output, options));

          if (options.earlyReturn) {
            return issues;
          }
        }
        return next(input, output, options, issues);
      },
      { type: CODE_STRING_ENDS_WITH, param: value }
    );
  };

  prototype.nonBlank = function (options) {
    const issueFactory = createIssueFactory(
      CODE_STRING_NON_BLANK,
      ctor.messages[CODE_STRING_NON_BLANK],
      options,
      undefined
    );

    return this.use(
      next => (input, output, options, issues) => {
        if (output.trim().length === 0) {
          (issues ||= []).push(issueFactory(output, options));

          if (options.earlyReturn) {
            return issues;
          }
        }
        return next(input, output, options, issues);
      },
      { type: CODE_STRING_NON_BLANK }
    );
  };

  prototype.nonEmpty = function (options) {
    return this.min(1, options);
  };

  prototype.trim = function () {
    return this.use(next => (input, output, options, issues) => next(input, output.trim(), options, issues), {
      type: 'string.trim',
    });
  };

  prototype.toLowerCase = function () {
    return this.use(next => (input, output, options, issues) => next(input, output.toLowerCase(), options, issues), {
      type: 'string.toLowerCase',
    });
  };

  prototype.toUpperCase = function () {
    return this.use(next => (input, output, options, issues) => next(input, output.toUpperCase(), options, issues), {
      type: 'string.toUpperCase',
    });
  };
}