import { ConstraintOptions, createIssueFactory, DateShape, Message, Shape } from '../core';
import { CODE_DATE_MAX, CODE_DATE_MIN, MESSAGE_DATE_MAX, MESSAGE_DATE_MIN } from '../constants';
import { addCheck } from '../helpers';

declare module '../core' {
  export interface DateShape {
    /**
     * Constrains the input date to be greater than or equal to another date.
     *
     * ⚠️ Provided by [doubter/plugins/date](https://github.com/smikhalevski/doubter#plugins) plugin.
     *
     * @param date The inclusive minimum date.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     */
    min(date: Date | number | string, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the input date to be less than or equal to another date.
     *
     * ⚠️ Provided by [doubter/plugins/date](https://github.com/smikhalevski/doubter#plugins) plugin.
     *
     * @param date The inclusive maximum date.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     */
    max(date: Date | number | string, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the input date to be greater than or equal to another date.
     *
     * ⚠️ Provided by [doubter/plugins/date](https://github.com/smikhalevski/doubter#plugins) plugin.
     *
     * Alias for {@linkcode min}.
     *
     * @param date The inclusive minimum date.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     */
    after(date: Date | number | string, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the input date to be less than or equal to another date.
     *
     * ⚠️ Provided by [doubter/plugins/date](https://github.com/smikhalevski/doubter#plugins) plugin.
     *
     * Alias for {@linkcode max}.
     *
     * @param date The inclusive maximum date.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     */
    before(date: Date | number | string, options?: ConstraintOptions | Message): this;

    /**
     * Transforms date to an ISO string.
     *
     * ⚠️ Provided by [doubter/plugins/date](https://github.com/smikhalevski/doubter#plugins) plugin.
     */
    iso(): Shape<Date, string>;

    /**
     * Transforms date to a timestamp integer number.
     *
     * ⚠️ Provided by [doubter/plugins/date](https://github.com/smikhalevski/doubter#plugins) plugin.
     */
    timestamp(): Shape<Date, number>;
  }
}

export default function () {
  DateShape.prototype.min = min;
  DateShape.prototype.max = max;
  DateShape.prototype.after = min;
  DateShape.prototype.before = max;
  DateShape.prototype.iso = iso;
  DateShape.prototype.timestamp = timestamp;
}

function min(this: DateShape, date: Date | number | string, options?: ConstraintOptions | Message): DateShape {
  date = new Date(date);

  const issueFactory = createIssueFactory(CODE_DATE_MIN, MESSAGE_DATE_MIN, options, date);

  return addCheck(this, CODE_DATE_MIN, date, (input, param, options) => {
    if (input.getTime() <= param.getTime()) {
      return issueFactory(input, options);
    }
  });
}

function max(this: DateShape, date: Date | number | string, options?: ConstraintOptions | Message): DateShape {
  date = new Date(date);

  const issueFactory = createIssueFactory(CODE_DATE_MAX, MESSAGE_DATE_MAX, options, date);

  return addCheck(this, CODE_DATE_MAX, date, (input, param, options) => {
    if (input.getTime() >= param.getTime()) {
      return issueFactory(input, options);
    }
  });
}

function iso(this: DateShape): Shape<Date, string> {
  return this.transform(date => date.toISOString());
}

function timestamp(this: DateShape): Shape<Date, number> {
  return this.transform(date => date.getTime());
}
