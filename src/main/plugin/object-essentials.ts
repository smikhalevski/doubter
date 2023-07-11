/**
 * The plugin that enhances {@linkcode doubter/core!ObjectShape} with additional methods.
 *
 * ```ts
 * import { ObjectShape } from 'doubter/core';
 * import enableObjectEssentials from 'doubter/plugin/object-essentials';
 *
 * enableObjectEssentials(ObjectShape.prototype);
 * ```
 *
 * @module doubter/plugin/object-essentials
 */

import {
  CODE_OBJECT_ALL_KEYS,
  CODE_OBJECT_NOT_ALL_KEYS,
  CODE_OBJECT_OR_KEYS,
  CODE_OBJECT_OXOR_KEYS,
  CODE_OBJECT_PLAIN,
  CODE_OBJECT_XOR_KEYS,
  MESSAGE_OBJECT_ALL_KEYS,
  MESSAGE_OBJECT_NOT_ALL_KEYS,
  MESSAGE_OBJECT_OR_KEYS,
  MESSAGE_OBJECT_OXOR_KEYS,
  MESSAGE_OBJECT_PLAIN,
  MESSAGE_OBJECT_XOR_KEYS,
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
     * @plugin {@link doubter/plugin/object-essentials!}
     */
    plain(options?: IssueOptions | Message): this;

    /**
     * Defines an all-or-nothing relationship between keys where if one of the keys is present, all of them are
     * required as well.
     *
     * @param keys The keys of which, if one present, all are required.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/object-essentials!}
     */
    allKeys<K extends readonly (keyof PropShapes)[]>(keys: K, options?: IssueOptions | Message): this;

    /**
     * Defines a relationship between keys where not all peers can be present at the same time.
     *
     * @param keys The keys of which, if one present, the others may not all be present.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/object-essentials!}
     */
    notAllKeys<K extends readonly (keyof PropShapes)[]>(keys: K, options?: IssueOptions | Message): this;

    /**
     * Defines a relationship between keys where at least one of the keys is required (and more than one is allowed).
     *
     * @param keys The keys of which at least one must appear.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/object-essentials!}
     */
    orKeys<K extends readonly (keyof PropShapes)[]>(keys: K, options?: IssueOptions | Message): this;

    /**
     * Defines an exclusive relationship between a set of keys where one of them is required but not at the same time.
     *
     * @param keys The exclusive keys that must not appear together but where one of them is required.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/object-essentials!}
     */
    xorKeys<K extends readonly (keyof PropShapes)[]>(keys: K, options?: IssueOptions | Message): this;

    /**
     * Defines an exclusive relationship between a set of keys where only one is allowed but none are required.
     *
     * @param keys The exclusive keys that must not appear together but where none are required.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link doubter/plugin/object-essentials!}
     */
    oxorKeys<K extends readonly (keyof PropShapes)[]>(keys: K, options?: IssueOptions | Message): this;
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

  prototype.allKeys = function (keys, options) {
    const issueFactory = createIssueFactory(CODE_OBJECT_ALL_KEYS, MESSAGE_OBJECT_ALL_KEYS, options, keys);

    return this.use(
      next => (input, output, options, issues) => {
        const keyCount = getKeyCount(output, keys, keys.length);

        if (keyCount > 0 && keyCount < keys.length) {
          issues = pushIssue(issues, issueFactory(output, options));

          if (options.earlyReturn) {
            return issues;
          }
        }
        return next(input, output, options, issues);
      },
      { type: CODE_OBJECT_ALL_KEYS, param: keys }
    );
  };

  prototype.notAllKeys = function (keys, options) {
    const issueFactory = createIssueFactory(CODE_OBJECT_NOT_ALL_KEYS, MESSAGE_OBJECT_NOT_ALL_KEYS, options, keys);

    return this.use(
      next => (input, output, options, issues) => {
        const keyCount = getKeyCount(output, keys, keys.length);

        if (keyCount > 0 && keyCount <= keys.length) {
          issues = pushIssue(issues, issueFactory(output, options));

          if (options.earlyReturn) {
            return issues;
          }
        }
        return next(input, output, options, issues);
      },
      { type: CODE_OBJECT_NOT_ALL_KEYS, param: keys }
    );
  };

  prototype.orKeys = function (keys, options) {
    const issueFactory = createIssueFactory(CODE_OBJECT_OR_KEYS, MESSAGE_OBJECT_OR_KEYS, options, keys);

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
      { type: CODE_OBJECT_OR_KEYS, param: keys }
    );
  };

  prototype.xorKeys = function (keys, options) {
    const issueFactory = createIssueFactory(CODE_OBJECT_XOR_KEYS, MESSAGE_OBJECT_XOR_KEYS, options, keys);

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
      { type: CODE_OBJECT_XOR_KEYS, param: keys }
    );
  };

  prototype.oxorKeys = function (keys, options) {
    const issueFactory = createIssueFactory(CODE_OBJECT_OXOR_KEYS, MESSAGE_OBJECT_OXOR_KEYS, options, keys);

    return this.use(
      next => (input, output, options, issues) => {
        if (getKeyCount(output, keys, 2) > 1) {
          issues = pushIssue(issues, issueFactory(output, options));

          if (options.earlyReturn) {
            return issues;
          }
        }
        return next(input, output, options, issues);
      },
      { type: CODE_OBJECT_OXOR_KEYS, param: keys }
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
