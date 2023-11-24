/**
 * The plugin that enhances {@link core!ObjectShape ObjectShape} with additional methods.
 *
 * ```ts
 * import { ObjectShape } from 'doubter/core';
 * import enableObjectEssentials from 'doubter/plugin/object-essentials';
 *
 * enableObjectEssentials(ObjectShape);
 * ```
 *
 * @module plugin/object-essentials
 */

import {
  CODE_OBJECT_ALL_KEYS,
  CODE_OBJECT_NOT_ALL_KEYS,
  CODE_OBJECT_OR_KEYS,
  CODE_OBJECT_OXOR_KEYS,
  CODE_OBJECT_PLAIN,
  CODE_OBJECT_XOR_KEYS,
} from '../constants';
import { ReadonlyDict } from '../internal/objects';
import { ObjectShape } from '../shape/ObjectShape';
import { AnyShape } from '../shape/Shape';
import { Any, IssueOptions, Message } from '../types';
import { createIssueFactory } from '../utils';

declare module '../core' {
  export interface Messages {
    /**
     * @default "Must contain all or no keys: %s"
     */
    'object.allKeys': Message | Any;

    /**
     * @default "Must contain not all or no keys: %s"
     */
    'object.notAllKeys': Message | Any;

    /**
     * @default "Must contain at least one key: %s"
     */
    'object.orKeys': Message | Any;

    /**
     * @default "Must contain exactly one key: %s"
     */
    'object.xorKeys': Message | Any;

    /**
     * @default "Must contain one or no keys: %s"
     */
    'object.oxorKeys': Message | Any;

    /**
     * @default "Must be a plain object"
     */
    'object.plain': Message | Any;
  }

  export interface ObjectShape<PropShapes extends ReadonlyDict<AnyShape>, RestShape extends AnyShape | null> {
    /**
     * Constrains an object to have a `null` or {@link !Object Object} prototype.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/object-essentials! plugin/object-essentials}
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
     * @plugin {@link plugin/object-essentials! plugin/object-essentials}
     */
    allKeys<K extends ReadonlyArray<keyof PropShapes>>(keys: K, options?: IssueOptions | Message): this;

    /**
     * Defines a relationship between keys where not all peers can be present at the same time.
     *
     * @param keys The keys of which, if one present, the others may not all be present.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/object-essentials! plugin/object-essentials}
     */
    notAllKeys<K extends ReadonlyArray<keyof PropShapes>>(keys: K, options?: IssueOptions | Message): this;

    /**
     * Defines a relationship between keys where at least one of the keys is required (and more than one is allowed).
     *
     * @param keys The keys of which at least one must appear.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/object-essentials! plugin/object-essentials}
     */
    orKeys<K extends ReadonlyArray<keyof PropShapes>>(keys: K, options?: IssueOptions | Message): this;

    /**
     * Defines an exclusive relationship between a set of keys where one of them is required but not at the same time.
     *
     * @param keys The exclusive keys that must not appear together but where one of them is required.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/object-essentials! plugin/object-essentials}
     */
    xorKeys<K extends ReadonlyArray<keyof PropShapes>>(keys: K, options?: IssueOptions | Message): this;

    /**
     * Defines an exclusive relationship between a set of keys where only one is allowed but none are required.
     *
     * @param keys The exclusive keys that must not appear together but where none are required.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/object-essentials! plugin/object-essentials}
     */
    oxorKeys<K extends ReadonlyArray<keyof PropShapes>>(keys: K, options?: IssueOptions | Message): this;
  }
}

/**
 * Enhances {@link core!ObjectShape ObjectShape} with additional methods.
 */
export default function enableObjectEssentials(ctor: typeof ObjectShape<any, any>): void {
  const { messages, prototype } = ctor;

  messages[CODE_OBJECT_ALL_KEYS] = 'Must contain all or no keys: %s';
  messages[CODE_OBJECT_NOT_ALL_KEYS] = 'Must contain not all or no keys: %s';
  messages[CODE_OBJECT_OR_KEYS] = 'Must contain at least one key: %s';
  messages[CODE_OBJECT_XOR_KEYS] = 'Must contain exactly one key: %s';
  messages[CODE_OBJECT_OXOR_KEYS] = 'Must contain one or no keys: %s';
  messages[CODE_OBJECT_PLAIN] = 'Must be a plain object';

  prototype.plain = function (options) {
    const { getPrototypeOf } = Object;
    const issueFactory = createIssueFactory(CODE_OBJECT_PLAIN, ctor.messages[CODE_OBJECT_PLAIN], options, undefined);

    return this.addOperation(
      (value, param, options) => {
        const prototype = getPrototypeOf(value);

        if (prototype === null || prototype.constructor === Object) {
          return null;
        }
        return [issueFactory(value, options)];
      },
      { type: CODE_OBJECT_PLAIN }
    );
  };

  prototype.allKeys = function (keys, options) {
    const issueFactory = createIssueFactory(CODE_OBJECT_ALL_KEYS, ctor.messages[CODE_OBJECT_ALL_KEYS], options, keys);

    return this.addOperation(
      (value, param, options) => {
        const keyCount = getKeyCount(value, keys, keys.length);

        if (keyCount === 0 || keyCount === keys.length) {
          return null;
        }
        return [issueFactory(value, options)];
      },
      { type: CODE_OBJECT_ALL_KEYS, param: keys }
    );
  };

  prototype.notAllKeys = function (keys, options) {
    const issueFactory = createIssueFactory(
      CODE_OBJECT_NOT_ALL_KEYS,
      ctor.messages[CODE_OBJECT_NOT_ALL_KEYS],
      options,
      keys
    );

    return this.addOperation(
      (value, param, options) => {
        if (getKeyCount(value, keys, keys.length) !== keys.length) {
          return null;
        }
        return [issueFactory(value, options)];
      },
      { type: CODE_OBJECT_NOT_ALL_KEYS, param: keys }
    );
  };

  prototype.orKeys = function (keys, options) {
    const issueFactory = createIssueFactory(CODE_OBJECT_OR_KEYS, ctor.messages[CODE_OBJECT_OR_KEYS], options, keys);

    return this.addOperation(
      (value, param, options) => {
        if (getKeyCount(value, keys, 1) !== 0) {
          return null;
        }
        return [issueFactory(value, options)];
      },
      { type: CODE_OBJECT_OR_KEYS, param: keys }
    );
  };

  prototype.xorKeys = function (keys, options) {
    const issueFactory = createIssueFactory(CODE_OBJECT_XOR_KEYS, ctor.messages[CODE_OBJECT_XOR_KEYS], options, keys);

    return this.addOperation(
      (value, param, options) => {
        if (getKeyCount(value, keys, 2) === 1) {
          return null;
        }
        return [issueFactory(value, options)];
      },
      { type: CODE_OBJECT_XOR_KEYS, param: keys }
    );
  };

  prototype.oxorKeys = function (keys, options) {
    const issueFactory = createIssueFactory(CODE_OBJECT_OXOR_KEYS, ctor.messages[CODE_OBJECT_OXOR_KEYS], options, keys);

    return this.addOperation(
      (value, param, options) => {
        if (getKeyCount(value, keys, 2) <= 1) {
          return null;
        }
        return [issueFactory(value, options)];
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
