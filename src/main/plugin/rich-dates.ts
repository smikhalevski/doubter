/**
 * The plugin that enhances {@linkcode doubter/core!DateShape} with additional methods.
 *
 * ```ts
 * import pluginRichDates from 'doubter/plugin/rich-dates';
 *
 * pluginRichDates();
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
    toISOString(): Shape<Date, string>;

    /**
     * Converts date to a timestamp integer number.
     *
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-dates!}
     */
    toTimestamp(): Shape<Date, number>;
  }
}

/**
 * Enhances {@linkcode doubter/core!DateShape} with additional methods.
 */
export default function () {
  DateShape.prototype.min = useMin;
  DateShape.prototype.max = useMax;
  DateShape.prototype.after = useMin;
  DateShape.prototype.before = useMax;
  DateShape.prototype.toISOString = convertToISOString;
  DateShape.prototype.toTimestamp = convertToTimestamp;
}

function useMin(this: DateShape, value: Date | number | string, options?: IssueOptions | Message): DateShape {
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
}

function useMax(this: DateShape, value: Date | number | string, options?: IssueOptions | Message): DateShape {
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
}

function convertToISOString(this: DateShape): Shape<Date, string> {
  return this.convert(toISOString);
}

function convertToTimestamp(this: DateShape): Shape<Date, number> {
  return this.convert(toTimestamp);
}

function toISOString(date: Date): string {
  return date.toISOString();
}

function toTimestamp(date: Date): number {
  return date.getTime();
}
