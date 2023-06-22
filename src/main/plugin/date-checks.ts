/**
 * The plugin that enhances {@linkcode doubter/core!DateShape} with additional checks.
 *
 * ```ts
 * import dateChecks from 'doubter/plugin/date-checks';
 *
 * dateChecks();
 * ```
 *
 * @module doubter/plugin/date-checks
 */

import { CODE_DATE_MAX, CODE_DATE_MIN, MESSAGE_DATE_MAX, MESSAGE_DATE_MIN } from '../constants';
import { ConstraintOptions, DateShape, Message, Shape } from '../core';
import { createIssueFactory } from '../utils';

declare module '../core' {
  export interface DateShape {
    /**
     * The inclusive minimum date, or `undefined` if there's no minimum date.
     *
     * @group Plugin Properties
     * @plugin {@link doubter/plugin/date-checks!}
     */
    readonly minValue: Date | undefined;

    /**
     * The inclusive maximum date, or `undefined` if there's no maximum date.
     *
     * @group Plugin Properties
     * @plugin {@link doubter/plugin/date-checks!}
     */
    readonly maxValue: Date | undefined;

    /**
     * Constrains the input date to be greater than or equal to another date.
     *
     * @param value The inclusive minimum date.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/date-checks!}
     */
    min(value: Date | number | string, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the input date to be less than or equal to another date.
     *
     * @param value The inclusive maximum date.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/date-checks!}
     */
    max(value: Date | number | string, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the input date to be greater than or equal to another date.
     *
     * @param value The inclusive minimum date.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @alias {@linkcode min}
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/date-checks!}
     */
    after(value: Date | number | string, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the input date to be less than or equal to another date.
     *
     * @param value The inclusive maximum date.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @alias {@linkcode max}
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/date-checks!}
     */
    before(value: Date | number | string, options?: ConstraintOptions | Message): this;

    /**
     * Converts date to an ISO string.
     *
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/date-checks!}
     */
    iso(): Shape<Date, string>;

    /**
     * Converts date to a timestamp integer number.
     *
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/date-checks!}
     */
    timestamp(): Shape<Date, number>;
  }
}

/**
 * Enhances {@linkcode doubter/core!DateShape} with additional checks.
 */
export default function () {
  const prototype = DateShape.prototype;

  // Object.defineProperties(prototype, {
  //   minValue: {
  //     configurable: true,
  //     get(this: DateShape) {
  //       return this.getOperationsByKey(CODE_DATE_MIN)?.param;
  //     },
  //   },
  //
  //   maxValue: {
  //     configurable: true,
  //     get(this: DateShape) {
  //       this['_operations'].find(op => op.key === CODE_DATE_MAX).
  //       return this.getOperationsByKey(CODE_DATE_MAX)?.param;
  //     },
  //   },
  // });

  prototype.min = min;
  prototype.max = max;
  prototype.after = min;
  prototype.before = max;
  prototype.iso = iso;
  prototype.timestamp = timestamp;
}

function min(this: DateShape, value: Date | number | string, options?: ConstraintOptions | Message): DateShape {
  value = new Date(value);

  const issueFactory = createIssueFactory(CODE_DATE_MIN, MESSAGE_DATE_MIN, options, value);

  return this.check(
    (input, param, options) => {
      if (input.getTime() < param.getTime()) {
        return issueFactory(input, options);
      }
    },
    { key: CODE_DATE_MIN, payload: value, force: true }
  );
}

function max(this: DateShape, value: Date | number | string, options?: ConstraintOptions | Message): DateShape {
  value = new Date(value);

  const issueFactory = createIssueFactory(CODE_DATE_MAX, MESSAGE_DATE_MAX, options, value);

  return this.check(
    (input, param, options) => {
      if (input.getTime() > param.getTime()) {
        return issueFactory(input, options);
      }
    },
    { key: CODE_DATE_MAX, payload: value, force: true }
  );
}

function iso(this: DateShape): Shape<Date, string> {
  return this.convert(date => date.toISOString());
}

function timestamp(this: DateShape): Shape<Date, number> {
  return this.convert(date => date.getTime());
}
