import { CODE_DATE_MAX, CODE_DATE_MIN, MESSAGE_DATE_MAX, MESSAGE_DATE_MIN } from '../constants';
import { ConstraintOptions, DateShape, Message, Shape } from '../core';
import { addCheck, createIssueFactory } from '../helpers';

declare module '../core' {
  export interface DateShape {
    /**
     * The inclusive minimum date, or `undefined` if there's no minimum date.
     *
     * @requires [doubter/plugins/date](https://github.com/smikhalevski/doubter#plugins)
     */
    readonly minDate: Date | undefined;

    /**
     * The inclusive maximum date, or `undefined` if there's no maximum date.
     *
     * @requires [doubter/plugins/date](https://github.com/smikhalevski/doubter#plugins)
     */
    readonly maxDate: Date | undefined;

    /**
     * Constrains the input date to be greater than or equal to another date.
     *
     * @param date The inclusive minimum date.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @requires [doubter/plugins/date](https://github.com/smikhalevski/doubter#plugins)
     */
    min(date: Date | number | string, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the input date to be less than or equal to another date.
     *
     * @param date The inclusive maximum date.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @requires [doubter/plugins/date](https://github.com/smikhalevski/doubter#plugins)
     */
    max(date: Date | number | string, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the input date to be greater than or equal to another date.
     *
     * @param date The inclusive minimum date.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @alias {@linkcode min}
     * @requires [doubter/plugins/date](https://github.com/smikhalevski/doubter#plugins)
     */
    after(date: Date | number | string, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the input date to be less than or equal to another date.
     *
     *
     * @param date The inclusive maximum date.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @alias {@linkcode max}
     * @requires [doubter/plugins/date](https://github.com/smikhalevski/doubter#plugins)
     */
    before(date: Date | number | string, options?: ConstraintOptions | Message): this;

    /**
     * Transforms date to an ISO string.
     *
     * @requires [doubter/plugins/date](https://github.com/smikhalevski/doubter#plugins)
     */
    iso(): Shape<Date, string>;

    /**
     * Transforms date to a timestamp integer number.
     *
     * @requires [doubter/plugins/date](https://github.com/smikhalevski/doubter#plugins)
     */
    timestamp(): Shape<Date, number>;
  }
}

export default function () {
  const prototype = DateShape.prototype;

  Object.defineProperties(prototype, {
    minDate: {
      configurable: true,
      get(this: DateShape) {
        return this.getCheck(CODE_DATE_MIN)?.param;
      },
    },

    maxDate: {
      configurable: true,
      get(this: DateShape) {
        return this.getCheck(CODE_DATE_MAX)?.param;
      },
    },
  });

  prototype.min = min;
  prototype.max = max;
  prototype.after = min;
  prototype.before = max;
  prototype.iso = iso;
  prototype.timestamp = timestamp;
}

function min(this: DateShape, date: Date | number | string, options?: ConstraintOptions | Message): DateShape {
  date = new Date(date);

  const issueFactory = createIssueFactory(CODE_DATE_MIN, MESSAGE_DATE_MIN, options, date);

  return addCheck(this, CODE_DATE_MIN, date, (input, param, options) => {
    if (input.getTime() < param.getTime()) {
      return issueFactory(input, options);
    }
  });
}

function max(this: DateShape, date: Date | number | string, options?: ConstraintOptions | Message): DateShape {
  date = new Date(date);

  const issueFactory = createIssueFactory(CODE_DATE_MAX, MESSAGE_DATE_MAX, options, date);

  return addCheck(this, CODE_DATE_MAX, date, (input, param, options) => {
    if (input.getTime() > param.getTime()) {
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
