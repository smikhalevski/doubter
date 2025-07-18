/**
 * The plugin that enhances {@link core!DateShape DateShape} with additional methods.
 *
 * ```ts
 * import * as d from 'doubter/core';
 * import 'doubter/plugin/date-essentials';
 *
 * d.date().after(Date.now());
 * ```
 *
 * @module plugin/date-essentials
 */

import { CODE_DATE_MAX, CODE_DATE_MIN, MESSAGE_DATE_MAX, MESSAGE_DATE_MIN } from '../constants.js';
import { DateShape } from '../shape/DateShape.js';
import { IssueOptions, Message } from '../types.js';
import { createIssue } from '../utils.js';

declare module '../core.js' {
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

DateShape.prototype.min = DateShape.prototype.after = function (value, issueOptions) {
  return this.addOperation(
    (value, param, options) => {
      if (value.getTime() >= param.getTime()) {
        return null;
      }
      return [createIssue(CODE_DATE_MIN, value, MESSAGE_DATE_MIN, param, options, issueOptions)];
    },
    { type: CODE_DATE_MIN, param: new Date(value) }
  );
};

DateShape.prototype.max = DateShape.prototype.before = function (value, issueOptions) {
  return this.addOperation(
    (value, param, options) => {
      if (value.getTime() <= param.getTime()) {
        return null;
      }
      return [createIssue(CODE_DATE_MAX, value, MESSAGE_DATE_MAX, param, options, issueOptions)];
    },
    { type: CODE_DATE_MAX, param: new Date(value) }
  );
};

DateShape.prototype.toISOString = function () {
  return this.convert(toISOString);
};

DateShape.prototype.toTimestamp = function () {
  return this.convert(toTimestamp);
};

function toISOString(date: Date): string {
  return date.toISOString();
}

function toTimestamp(date: Date): number {
  return date.getTime();
}
