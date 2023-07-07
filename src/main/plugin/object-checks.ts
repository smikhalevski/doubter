/**
 * The plugin that enhances {@linkcode doubter/core!ObjectShape} with additional checks.
 *
 * ```ts
 * import objectChecks from 'doubter/plugin/object-checks';
 *
 * objectChecks();
 * ```
 *
 * @module doubter/plugin/object-checks
 */

import { CODE_OBJECT_PLAIN, MESSAGE_OBJECT_PLAIN } from '../constants';
import { AnyShape, IssueOptions, Message, ObjectShape } from '../core';
import { isPlainObject, pushIssue, ReadonlyDict } from '../internal';
import { createIssueFactory } from '../utils';

declare module '../core' {
  interface ObjectShape<PropShapes extends ReadonlyDict<AnyShape>, RestShape extends AnyShape | null> {
    /**
     * Constrains an object to have a `null` or `Object` prototype.
     *
     * @returns The clone of the shape.
     * @param options The issue options or the issue message.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/object-checks!}
     */
    plain(options?: IssueOptions | Message): this;
  }
}

/**
 * Enhances {@linkcode doubter/core!ObjectShape} with additional checks.
 */
export default function () {
  ObjectShape.prototype.plain = plainCheck;
}

function plainCheck(this: ObjectShape<any, any>, options?: IssueOptions | Message): ObjectShape<any, any> {
  const issueFactory = createIssueFactory(CODE_OBJECT_PLAIN, MESSAGE_OBJECT_PLAIN, options, undefined);

  return this.use(
    next => (input, output, options, issues) => {
      if (!isPlainObject(output)) {
        issues = pushIssue(issues, issueFactory(output, options));

        if (options.earlyReturn) {
          return issues;
        }
      }
      return next(input, output, options, issues);
    },
    { type: CODE_OBJECT_PLAIN }
  );
}
