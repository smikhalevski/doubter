/**
 * The plugin that enhances {@linkcode doubter/core!SetShape} with additional checks.
 *
 * ```ts
 * import setChecks from 'doubter/plugin/set-checks';
 *
 * setChecks();
 * ```
 *
 * @module doubter/plugin/set-checks
 */
import { CODE_SET_MAX, CODE_SET_MIN, MESSAGE_SET_MAX, MESSAGE_SET_MIN } from '../constants';
import { AnyShape, ConstraintOptions, Message, SetShape } from '../core';
import { pushIssue } from '../internal';
import { createIssueFactory } from '../utils';

declare module '../core' {
  export interface SetShape<ValueShape extends AnyShape> {
    /**
     * Constrains the set size.
     *
     * @param size The minimum set size.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/set-checks!}
     */
    size(size: number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the minimum set size.
     *
     * @param size The minimum set size.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/set-checks!}
     */
    min(size: number, options?: ConstraintOptions | Message): this;

    /**
     * Constrains the maximum set size.
     *
     * @param size The maximum set size.
     * @param options The constraint options or an issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/set-checks!}
     */
    max(size: number, options?: ConstraintOptions | Message): this;
  }
}

/**
 * Enhances {@linkcode doubter/core!SetShape} with additional checks.
 */
export default function () {
  SetShape.prototype.size = size;
  SetShape.prototype.min = min;
  SetShape.prototype.max = max;
}

function size(this: SetShape<any>, size: number, options?: ConstraintOptions | Message): SetShape<any> {
  return this.min(size, options).max(size, options);
}

function min(this: SetShape<any>, size: number, options?: ConstraintOptions | Message): SetShape<any> {
  const issueFactory = createIssueFactory(CODE_SET_MIN, MESSAGE_SET_MIN, options, size);

  return this._appendOperation({
    type: CODE_SET_MIN,
    param: size,
    compile: next => (input, output, options, issues) => {
      if (output.size < size) {
        issues = pushIssue(issues, issueFactory(output, options));

        if (!options.verbose) {
          return issues;
        }
      }
      return next(input, output, options, issues);
    },
  });
}

function max(this: SetShape<any>, size: number, options?: ConstraintOptions | Message): SetShape<any> {
  const issueFactory = createIssueFactory(CODE_SET_MAX, MESSAGE_SET_MAX, options, size);

  return this._appendOperation({
    type: CODE_SET_MAX,
    param: size,
    compile: next => (input, output, options, issues) => {
      if (output.size > size) {
        issues = pushIssue(issues, issueFactory(output, options));

        if (!options.verbose) {
          return issues;
        }
      }
      return next(input, output, options, issues);
    },
  });
}
