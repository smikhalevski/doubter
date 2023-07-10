/**
 * The plugin that enhances {@linkcode doubter/core!DateShape} with additional methods.
 *
 * ```ts
 * import { DateShape } from 'doubter/core';
 * import enhanceDateShape from 'doubter/plugin/rich-dates';
 *
 * enhanceDateShape(DateShape.prototype);
 * ```
 *
 * @module doubter/plugin/rich-dates
 */

import { CODE_DATE_MAX, CODE_DATE_MIN, MESSAGE_DATE_MAX, MESSAGE_DATE_MIN } from '../constants';
import { DateShape, IssueOptions, Message, Shape } from '../core';
import { pushIssue } from '../internal';
import { createIssueFactory } from '../utils';

declare module '../core' {
  export interface DateShape {
    /**
     * Constrains the input date to be greater than or equal to another date.
     *
     * @param value The inclusive minimum date.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-dates!}
     */
    min(value: Date | number | string, options?: IssueOptions | Message): this;

    /**
     * Constrains the input date to be less than or equal to another date.
     *
     * @param value The inclusive maximum date.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-dates!}
     */
    max(value: Date | number | string, options?: IssueOptions | Message): this;

    /**
     * Constrains the input date to be greater than or equal to another date.
     *
     * @param value The inclusive minimum date.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @alias {@linkcode min}
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-dates!}
     */
    after(value: Date | number | string, options?: IssueOptions | Message): this;

    /**
     * Constrains the input date to be less than or equal to another date.
     *
     * @param value The inclusive maximum date.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @alias {@linkcode max}
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-dates!}
     */
    before(value: Date | number | string, options?: IssueOptions | Message): this;

    /**
     * Converts date to an ISO string.
     *
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-dates!}
     */
    iso(): Shape<Date, string>;

    /**
     * Converts date to a timestamp integer number.
     *
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-dates!}
     */
    timestamp(): Shape<Date, number>;
  }
}

/**
 * Enhances {@linkcode doubter/core!DateShape} with additional methods.
 */
export default function (prototype: DateShape): void {
  prototype.min = function (value, options) {
    const param = new Date(value);
    const timestamp = param.getTime();
    const issueFactory = createIssueFactory(CODE_DATE_MIN, MESSAGE_DATE_MIN, options, param);

    return this.use(
      next => (input, output, options, issues) => {
        if (output.getTime() < timestamp) {
          issues = pushIssue(issues, issueFactory(output, options));

          if (options.earlyReturn) {
            return issues;
          }
        }
        return next(input, output, options, issues);
      },
      { type: CODE_DATE_MIN, param }
    );
  };

  prototype.max = function (value, options) {
    const param = new Date(value);
    const timestamp = param.getTime();
    const issueFactory = createIssueFactory(CODE_DATE_MAX, MESSAGE_DATE_MAX, options, param);

    return this.use(
      next => (input, output, options, issues) => {
        if (output.getTime() > timestamp) {
          issues = pushIssue(issues, issueFactory(output, options));

          if (options.earlyReturn) {
            return issues;
          }
        }
        return next(input, output, options, issues);
      },
      { type: CODE_DATE_MAX, param }
    );
  };

  prototype.after = prototype.min;

  prototype.before = prototype.max;

  prototype.iso = function () {
    return this.convert(toISOString);
  };

  prototype.timestamp = function () {
    return this.convert(toTimestamp);
  };
}

function toISOString(date: Date): string {
  return date.toISOString();
}

function toTimestamp(date: Date): number {
  return date.getTime();
}
