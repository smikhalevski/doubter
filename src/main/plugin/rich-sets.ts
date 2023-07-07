/**
 * The plugin that enhances {@linkcode doubter/core!SetShape} with additional methods.
 *
 * ```ts
 * import pluginRichSets from 'doubter/plugin/rich-sets';
 *
 * pluginRichSets();
 * ```
 *
 * @module doubter/plugin/rich-sets
 */
import { CODE_SET_MAX, CODE_SET_MIN, MESSAGE_SET_MAX, MESSAGE_SET_MIN } from '../constants';
import { AnyShape, IssueOptions, Message, SetShape } from '../core';
import { pushIssue } from '../internal';
import { createIssueFactory } from '../utils';

declare module '../core' {
  export interface SetShape<ValueShape extends AnyShape> {
    /**
     * Constrains the set size.
     *
     * @param size The minimum set size.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-sets!}
     */
    size(size: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the minimum set size.
     *
     * @param size The minimum set size.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-sets!}
     */
    min(size: number, options?: IssueOptions | Message): this;

    /**
     * Constrains the maximum set size.
     *
     * @param size The maximum set size.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-sets!}
     */
    max(size: number, options?: IssueOptions | Message): this;
  }
}

/**
 * Enhances {@linkcode doubter/core!SetShape} with additional methods.
 */
export default function () {
  SetShape.prototype.size = useSize;
  SetShape.prototype.min = useMin;
  SetShape.prototype.max = useMax;
}

function useSize(this: SetShape<any>, size: number, options?: IssueOptions | Message): SetShape<any> {
  return this.min(size, options).max(size, options);
}

function useMin(this: SetShape<any>, size: number, options?: IssueOptions | Message): SetShape<any> {
  const issueFactory = createIssueFactory(CODE_SET_MIN, MESSAGE_SET_MIN, options, size);

  return this.use(
    next => (input, output, options, issues) => {
      if (output.size < size) {
        issues = pushIssue(issues, issueFactory(output, options));

        if (options.earlyReturn) {
          return issues;
        }
      }
      return next(input, output, options, issues);
    },
    { type: CODE_SET_MIN, param: size }
  );
}

function useMax(this: SetShape<any>, size: number, options?: IssueOptions | Message): SetShape<any> {
  const issueFactory = createIssueFactory(CODE_SET_MAX, MESSAGE_SET_MAX, options, size);

  return this.use(
    next => (input, output, options, issues) => {
      if (output.size > size) {
        issues = pushIssue(issues, issueFactory(output, options));

        if (options.earlyReturn) {
          return issues;
        }
      }
      return next(input, output, options, issues);
    },
    { type: CODE_SET_MAX, param: size }
  );
}
