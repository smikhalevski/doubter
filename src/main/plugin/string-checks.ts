/**
 * @module doubter/plugin/string-checks
 */

import {
  CODE_STRING_MAX,
  CODE_STRING_MIN,
  CODE_STRING_REGEX,
  MESSAGE_STRING_MAX,
  MESSAGE_STRING_MIN,
  MESSAGE_STRING_REGEX,
} from '../constants';
import { ConstraintOptions, Message, StringShape } from '../core';
import { addCheck, createIssueFactory } from '../utils';

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
  }
}

export default function () {
  const prototype = StringShape.prototype;

  Object.defineProperties(prototype, {
    minLength: {
      configurable: true,
      get(this: StringShape) {
        return this.getCheck(CODE_STRING_MIN)?.param;
      },
    },

    maxLength: {
      configurable: true,
      get(this: StringShape) {
        return this.getCheck(CODE_STRING_MAX)?.param;
      },
    },

    pattern: {
      configurable: true,
      get(this: StringShape) {
        return this.getCheck(CODE_STRING_REGEX)?.param;
      },
    },
  });

  prototype.length = length;
  prototype.min = min;
  prototype.max = max;
  prototype.regex = regex;
}

function length(this: StringShape, length: number, options?: ConstraintOptions | Message): StringShape {
  return this.min(length, options).max(length, options);
}

function min(this: StringShape, length: number, options?: ConstraintOptions | Message): StringShape {
  const issueFactory = createIssueFactory(CODE_STRING_MIN, MESSAGE_STRING_MIN, options, length);

  return addCheck(this, CODE_STRING_MIN, length, (input, param, options) => {
    if (input.length < param) {
      return issueFactory(input, options);
    }
  });
}

function max(this: StringShape, length: number, options?: ConstraintOptions | Message): StringShape {
  const issueFactory = createIssueFactory(CODE_STRING_MAX, MESSAGE_STRING_MAX, options, length);

  return addCheck(this, CODE_STRING_MAX, length, (input, param, options) => {
    if (input.length > param) {
      return issueFactory(input, options);
    }
  });
}

function regex(this: StringShape, re: RegExp, options?: ConstraintOptions | Message): StringShape {
  const issueFactory = createIssueFactory(CODE_STRING_REGEX, MESSAGE_STRING_REGEX, options, re);

  return addCheck(this, re.toString(), re, (input, param, options) => {
    param.lastIndex = 0;

    if (!param.test(input)) {
      return issueFactory(input, options);
    }
  });
}
