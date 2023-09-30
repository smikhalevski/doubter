/**
 * The plugin that enhances {@link core!DateShape DateShape} with additional methods.
 *
 * ```ts
 * import { DateShape } from 'doubter/core';
 * import enableDateEssentials from 'doubter/plugin/date-essentials';
 *
 * enableDateEssentials(DateShape.prototype);
 * ```
 *
 * @module plugin/date-essentials
 */

import { CODE_DATE_MAX, CODE_DATE_MIN } from '../constants';
import { DateShape, IssueOptions, Message, Shape } from '../core';
import { createIssueFactory } from '../utils';

declare module '../core' {
  export interface Messages {
    'date.min': any;
    'date.max': any;
  }

  export interface DateShape {
    /**
     * Constrains the input date to be greater than or equal to another date.
     *
     * @param value The inclusive minimum date.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/date-essentials! plugin/date-essentials}
     */
    min(value: Date | number | string, options?: IssueOptions | Message): this;

    /**
     * Constrains the input date to be less than or equal to another date.
     *
     * @param value The inclusive maximum date.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/date-essentials! plugin/date-essentials}
     */
    max(value: Date | number | string, options?: IssueOptions | Message): this;

    /**
     * Constrains the input date to be greater than or equal to another date.
     *
     * @param value The inclusive minimum date.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @alias {@link DateShape.min}
     * @group Plugin Methods
     * @plugin {@link plugin/date-essentials! plugin/date-essentials}
     */
    after(value: Date | number | string, options?: IssueOptions | Message): this;

    /**
     * Constrains the input date to be less than or equal to another date.
     *
     * @param value The inclusive maximum date.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @alias {@link DateShape.max}
     * @group Plugin Methods
     * @plugin {@link plugin/date-essentials! plugin/date-essentials}
     */
    before(value: Date | number | string, options?: IssueOptions | Message): this;

    /**
     * Converts date to an ISO string.
     *
     * @group Plugin Methods
     * @plugin {@link plugin/date-essentials! plugin/date-essentials}
     */
    toISOString(): Shape<Date, string>;

    /**
     * Converts date to a timestamp integer number.
     *
     * @group Plugin Methods
     * @plugin {@link plugin/date-essentials! plugin/date-essentials}
     */
    toTimestamp(): Shape<Date, number>;
  }
}

/**
 * Enhances {@link core!DateShape DateShape} with additional methods.
 */
export default function enableDateEssentials(ctor: typeof DateShape): void {
  const { messages, prototype } = ctor;

  messages[CODE_DATE_MIN] = 'Must be after %s';
  messages[CODE_DATE_MAX] = 'Must be before %s';

  prototype.min = function (value, options) {
    const param = new Date(value);
    const timestamp = param.getTime();
    const issueFactory = createIssueFactory(CODE_DATE_MIN, ctor.messages[CODE_DATE_MIN], options, param);

    return this.use(
      next => (input, output, options, issues) => {
        if (output.getTime() < timestamp) {
          (issues ||= []).push(issueFactory(output, options));

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
    const issueFactory = createIssueFactory(CODE_DATE_MAX, ctor.messages[CODE_DATE_MAX], options, param);

    return this.use(
      next => (input, output, options, issues) => {
        if (output.getTime() > timestamp) {
          (issues ||= []).push(issueFactory(output, options));

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

  prototype.toISOString = function () {
    return this.convert(toISOString);
  };

  prototype.toTimestamp = function () {
    return this.convert(toTimestamp);
  };
}

function toISOString(date: Date): string {
  return date.toISOString();
}

function toTimestamp(date: Date): number {
  return date.getTime();
}
