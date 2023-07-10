/**
 * The plugin that enhances {@linkcode doubter/core!ObjectShape} with additional methods.
 *
 * ```ts
 * import { ObjectShape } from 'doubter/core';
 * import enhanceObjectShape from 'doubter/plugin/rich-objects';
 *
 * enhanceObjectShape(ObjectShape.prototype);
 * ```
 *
 * @module doubter/plugin/rich-objects
 */

import {
  CODE_OBJECT_KEYS_AND,
  CODE_OBJECT_KEYS_OR,
  CODE_OBJECT_KEYS_XOR,
  CODE_OBJECT_PLAIN,
  MESSAGE_OBJECT_KEYS_AND,
  MESSAGE_OBJECT_KEYS_OR,
  MESSAGE_OBJECT_KEYS_XOR,
  MESSAGE_OBJECT_PLAIN,
} from '../constants';
import { AnyShape, IssueOptions, Message, ObjectShape } from '../core';
import { isPlainObject, pushIssue, ReadonlyDict } from '../internal';
import { createIssueFactory } from '../utils';

declare module '../core' {
  interface ObjectShape<PropShapes extends ReadonlyDict<AnyShape>, RestShape extends AnyShape | null> {
    /**
     * Constrains an object to have a `null` or `Object` prototype.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-objects!}
     */
    plain(options?: IssueOptions | Message): this;

    /**
     * Defines an all-or-nothing relationship between keys where if one of the peers is present, all of them are
     * required as well.
     *
     * @param keys The keys of which, if one present, all are required.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-objects!}
     */
    keysAnd<K extends readonly (keyof PropShapes)[]>(keys: K, options?: IssueOptions | Message): this;

    /**
     * Defines a relationship between keys where one of the peers is required (and more than one is allowed).
     *
     * @param keys The keys of which at least one must appear.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-objects!}
     */
    keysOr<K extends readonly (keyof PropShapes)[]>(keys: K, options?: IssueOptions | Message): this;

    /**
     * Defines an exclusive relationship between a set of keys where one of them is required but not at the same time.
     *
     * @param keys The exclusive keys that must not appear together but where one of them is required.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/rich-objects!}
     */
    keysXor<K extends readonly (keyof PropShapes)[]>(keys: K, options?: IssueOptions | Message): this;
  }
}

/**
 * Enhances {@linkcode doubter/core!ObjectShape} with additional methods.
 */
export default function (prototype: ObjectShape<any, any>): void {
  prototype.plain = function (options) {
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
  };

  prototype.keysAnd = function (keys, options) {
    const issueFactory = createIssueFactory(CODE_OBJECT_KEYS_AND, MESSAGE_OBJECT_KEYS_AND, options, keys);

    return this.use(
      next => (input, output, options, issues) => {
        const count = getKeyCount(output, keys, keys.length);

        if (count > 0 && count < keys.length) {
          issues = pushIssue(issues, issueFactory(output, options));

          if (options.earlyReturn) {
            return issues;
          }
        }
        return next(input, output, options, issues);
      },
      { type: CODE_OBJECT_KEYS_AND, param: keys }
    );
  };

  prototype.keysOr = function (keys, options) {
    const issueFactory = createIssueFactory(CODE_OBJECT_KEYS_OR, MESSAGE_OBJECT_KEYS_OR, options, keys);

    return this.use(
      next => (input, output, options, issues) => {
        if (getKeyCount(output, keys, 1) === 0) {
          issues = pushIssue(issues, issueFactory(output, options));

          if (options.earlyReturn) {
            return issues;
          }
        }
        return next(input, output, options, issues);
      },
      { type: CODE_OBJECT_KEYS_OR, param: keys }
    );
  };

  prototype.keysXor = function (keys, options) {
    const issueFactory = createIssueFactory(CODE_OBJECT_KEYS_XOR, MESSAGE_OBJECT_KEYS_XOR, options, keys);

    return this.use(
      next => (input, output, options, issues) => {
        if (getKeyCount(output, keys, 2) !== 1) {
          issues = pushIssue(issues, issueFactory(output, options));

          if (options.earlyReturn) {
            return issues;
          }
        }
        return next(input, output, options, issues);
      },
      { type: CODE_OBJECT_KEYS_XOR, param: keys }
    );
  };
}

function getKeyCount(output: ReadonlyDict, keys: readonly any[], maxCount: number): number {
  let count = 0;

  for (let i = 0; i < keys.length && count < maxCount; ++i) {
    if (output[keys[i]] !== undefined) {
      ++count;
    }
  }
  return count;
}
