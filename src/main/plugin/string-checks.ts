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
import { ConstraintOptions, Message, StringShape } from '../core';
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
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/string-checks!}
     */
    length(length: number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the string length to be greater than or equal to the length.
     *
     * @param length The minimum string length.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/string-checks!}
     */
    min(length: number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the string length to be less than or equal to the length.
     *
     * @param length The maximum string length.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/string-checks!}
     */
    max(length: number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the string to match a regexp.
     *
     * @param re The regular expression that the sting must conform.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/string-checks!}
     */
    regex(re: RegExp, options?: ConstraintOptions | Message): this;

    /**
     * Checks that the string includes a substring.
     *
     * @param value The substring to look for.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/string-checks!}
     */
    includes(value: string, options?: ConstraintOptions | Message): this;

    /**
     * Checks that the string starts with a substring.
     *
     * @param value The substring to look for.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/string-checks!}
     */
    startsWith(value: string, options?: ConstraintOptions | Message): this;

    /**
     * Checks that the string ends with a substring.
     *
     * @param value The substring to look for.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/string-checks!}
     */
    endsWith(value: string, options?: ConstraintOptions | Message): this;
  }
}

/**
 * Enhances {@linkcode doubter/core!StringShape} with additional checks.
 */
export default function () {
  const prototype = StringShape.prototype;

  // Object.defineProperties(prototype, {
  //   minLength: {
  //     configurable: true,
  //     get(this: StringShape) {
  //       return this.getOperationsByKey(CODE_STRING_MIN)?.param;
  //     },
  //   },
  //
  //   maxLength: {
  //     configurable: true,
  //     get(this: StringShape) {
  //       return this.getOperationsByKey(CODE_STRING_MAX)?.param;
  //     },
  //   },
  //
  //   pattern: {
  //     configurable: true,
  //     get(this: StringShape) {
  //       return this.getOperationsByKey(CODE_STRING_REGEX)?.param;
  //     },
  //   },
  // });

  prototype.length = length;
  prototype.min = min;
  prototype.max = max;
  prototype.regex = regex;
  prototype.includes = includes;
  prototype.startsWith = startsWith;
  prototype.endsWith = endsWith;
}

function length(this: StringShape, length: number, options?: ConstraintOptions | Message): StringShape {
  return this.min(length, options).max(length, options);
}

function min(this: StringShape, length: number, options?: ConstraintOptions | Message): StringShape {
  const issueFactory = createIssueFactory(CODE_STRING_MIN, MESSAGE_STRING_MIN, options, length);

  return this.check(
    (input, param, options) => {
      if (input.length < param) {
        return issueFactory(input, options);
      }
    },
    { key: CODE_STRING_MIN, payload: length, force: true }
  );
}

function max(this: StringShape, length: number, options?: ConstraintOptions | Message): StringShape {
  const issueFactory = createIssueFactory(CODE_STRING_MAX, MESSAGE_STRING_MAX, options, length);

  return this.check(
    (input, param, options) => {
      if (input.length > param) {
        return issueFactory(input, options);
      }
    },
    { key: CODE_STRING_MAX, payload: length, force: true }
  );
}

function regex(this: StringShape, re: RegExp, options?: ConstraintOptions | Message): StringShape {
  const issueFactory = createIssueFactory(CODE_STRING_REGEX, MESSAGE_STRING_REGEX, options, re);

  return this.check(
    (input, param, options) => {
      param.lastIndex = 0;

      if (!param.test(input)) {
        return issueFactory(input, options);
      }
    },
    { key: CODE_STRING_REGEX, payload: re, force: true }
  );
}

function includes(this: StringShape, value: string, options?: ConstraintOptions | Message): StringShape {
  const issueFactory = createIssueFactory(CODE_STRING_INCLUDES, MESSAGE_STRING_INCLUDES, options, value);

  return this.check(
    (input, param, options) => {
      if (input.includes(param)) {
        return issueFactory(input, options);
      }
    },
    { key: CODE_STRING_INCLUDES, payload: value, force: true }
  );
}

function startsWith(this: StringShape, value: string, options?: ConstraintOptions | Message): StringShape {
  const issueFactory = createIssueFactory(CODE_STRING_STARTS_WITH, MESSAGE_STRING_STARTS_WITH, options, value);

  return this.check(
    (input, param, options) => {
      if (input.startsWith(param)) {
        return issueFactory(input, options);
      }
    },
    { key: CODE_STRING_STARTS_WITH, payload: value, force: true }
  );
}

function endsWith(this: StringShape, value: string, options?: ConstraintOptions | Message): StringShape {
  const issueFactory = createIssueFactory(CODE_STRING_ENDS_WITH, MESSAGE_STRING_ENDS_WITH, options, value);

  return this.check(
    (input, param, options) => {
      if (input.endsWith(param)) {
        return issueFactory(input, options);
      }
    },
    { key: CODE_STRING_ENDS_WITH, payload: value, force: true }
  );
}
