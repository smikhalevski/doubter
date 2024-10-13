/**
 * The plugin that enhances {@link core!ObjectShape ObjectShape} and {@link core!RecordShape RecordShape} with
 * additional methods.
 *
 * ```ts
 * import * as d from 'doubter/core';
 * import 'doubter/plugin/object-essentials';
 *
 * d.object({ foo: d.string() }).plain();
 *
 * d.record(d.string()).plain();
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
  MESSAGE_OBJECT_ALL_KEYS,
  MESSAGE_OBJECT_NOT_ALL_KEYS,
  MESSAGE_OBJECT_OR_KEYS,
  MESSAGE_OBJECT_OXOR_KEYS,
  MESSAGE_OBJECT_PLAIN,
  MESSAGE_OBJECT_XOR_KEYS,
} from '../constants';
import { isPlainObject } from '../internal/lang';
import { ReadonlyDict } from '../internal/objects';
import { OUTPUT } from '../internal/shapes';
import { ObjectShape } from '../shape/ObjectShape';
import { RecordShape } from '../shape/RecordShape';
import { AnyShape, Shape } from '../shape/Shape';
import { IssueOptions, Message } from '../types';
import { createIssue } from '../utils';

declare module '../core' {
  export interface ObjectShape<PropShapes extends ReadonlyDict<AnyShape>, RestShape extends AnyShape | null> {
    /**
     * Constrains an object to have a `null` or {@link !Object} prototype.
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
    allKeys(keys: ReadonlyArray<keyof PropShapes>, options?: IssueOptions | Message): this;

    /**
     * Defines a relationship between keys where not all peers can be present at the same time.
     *
     * @param keys The keys of which, if one present, the others may not all be present.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/object-essentials! plugin/object-essentials}
     */
    notAllKeys(keys: ReadonlyArray<keyof PropShapes>, options?: IssueOptions | Message): this;

    /**
     * Defines a relationship between keys where at least one of the keys is required (and more than one is allowed).
     *
     * @param keys The keys of which at least one must appear.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/object-essentials! plugin/object-essentials}
     */
    orKeys(keys: ReadonlyArray<keyof PropShapes>, options?: IssueOptions | Message): this;

    /**
     * Defines an exclusive relationship between a set of keys where one of them is required but not at the same time.
     *
     * @param keys The exclusive keys that must not appear together but where one of them is required.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/object-essentials! plugin/object-essentials}
     */
    xorKeys(keys: ReadonlyArray<keyof PropShapes>, options?: IssueOptions | Message): this;

    /**
     * Defines an exclusive relationship between a set of keys where only one is allowed but none are required.
     *
     * @param keys The exclusive keys that must not appear together but where none are required.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/object-essentials! plugin/object-essentials}
     */
    oxorKeys(keys: ReadonlyArray<keyof PropShapes>, options?: IssueOptions | Message): this;
  }

  export interface RecordShape<KeysShape extends Shape<string, PropertyKey>, ValuesShape extends AnyShape> {
    /**
     * Constrains a record to have a `null` or {@link !Object} prototype.
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
    allKeys(keys: Array<KeysShape[OUTPUT]>, options?: IssueOptions | Message): this;

    /**
     * Defines a relationship between keys where not all peers can be present at the same time.
     *
     * @param keys The keys of which, if one present, the others may not all be present.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/object-essentials! plugin/object-essentials}
     */
    notAllKeys(keys: Array<KeysShape[OUTPUT]>, options?: IssueOptions | Message): this;

    /**
     * Defines a relationship between keys where at least one of the keys is required (and more than one is allowed).
     *
     * @param keys The keys of which at least one must appear.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/object-essentials! plugin/object-essentials}
     */
    orKeys(keys: Array<KeysShape[OUTPUT]>, options?: IssueOptions | Message): this;

    /**
     * Defines an exclusive relationship between a set of keys where one of them is required but not at the same time.
     *
     * @param keys The exclusive keys that must not appear together but where one of them is required.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/object-essentials! plugin/object-essentials}
     */
    xorKeys(keys: Array<KeysShape[OUTPUT]>, options?: IssueOptions | Message): this;

    /**
     * Defines an exclusive relationship between a set of keys where only one is allowed but none are required.
     *
     * @param keys The exclusive keys that must not appear together but where none are required.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/object-essentials! plugin/object-essentials}
     */
    oxorKeys(keys: Array<KeysShape[OUTPUT]>, options?: IssueOptions | Message): this;
  }
}

ObjectShape.prototype.plain = RecordShape.prototype.plain = function (issueOptions): any {
  return this.addOperation(
    (value, param, options) => {
      if (isPlainObject(value)) {
        return null;
      }
      return [createIssue(CODE_OBJECT_PLAIN, value, MESSAGE_OBJECT_PLAIN, param, options, issueOptions)];
    },
    { type: CODE_OBJECT_PLAIN }
  );
};

ObjectShape.prototype.allKeys = RecordShape.prototype.allKeys = function (keys, issueOptions): any {
  return this.addOperation(
    (value, param, options) => {
      const keyCount = getKeyCount(value, param, param.length);

      if (keyCount === 0 || keyCount === param.length) {
        return null;
      }
      return [createIssue(CODE_OBJECT_ALL_KEYS, value, MESSAGE_OBJECT_ALL_KEYS, param, options, issueOptions)];
    },
    { type: CODE_OBJECT_ALL_KEYS, param: keys }
  );
};

ObjectShape.prototype.notAllKeys = RecordShape.prototype.notAllKeys = function (keys, issueOptions): any {
  return this.addOperation(
    (value, param, options) => {
      if (getKeyCount(value, param, param.length) !== param.length) {
        return null;
      }
      return [createIssue(CODE_OBJECT_NOT_ALL_KEYS, value, MESSAGE_OBJECT_NOT_ALL_KEYS, param, options, issueOptions)];
    },
    { type: CODE_OBJECT_NOT_ALL_KEYS, param: keys }
  );
};

ObjectShape.prototype.orKeys = RecordShape.prototype.orKeys = function (keys, issueOptions): any {
  return this.addOperation(
    (value, param, options) => {
      if (getKeyCount(value, param, 1) !== 0) {
        return null;
      }
      return [createIssue(CODE_OBJECT_OR_KEYS, value, MESSAGE_OBJECT_OR_KEYS, param, options, issueOptions)];
    },
    { type: CODE_OBJECT_OR_KEYS, param: keys }
  );
};

ObjectShape.prototype.xorKeys = RecordShape.prototype.xorKeys = function (keys, issueOptions): any {
  return this.addOperation(
    (value, param, options) => {
      if (getKeyCount(value, param, 2) === 1) {
        return null;
      }
      return [createIssue(CODE_OBJECT_XOR_KEYS, value, MESSAGE_OBJECT_XOR_KEYS, param, options, issueOptions)];
    },
    { type: CODE_OBJECT_XOR_KEYS, param: keys }
  );
};

ObjectShape.prototype.oxorKeys = RecordShape.prototype.oxorKeys = function (keys, issueOptions): any {
  return this.addOperation(
    (value, param, options) => {
      if (getKeyCount(value, param, 2) <= 1) {
        return null;
      }
      return [createIssue(CODE_OBJECT_OXOR_KEYS, value, MESSAGE_OBJECT_OXOR_KEYS, param, options, issueOptions)];
    },
    { type: CODE_OBJECT_OXOR_KEYS, param: keys }
  );
};

function getKeyCount(output: ReadonlyDict, keys: readonly string[], maxCount: number): number {
  let count = 0;

  for (let i = 0; i < keys.length && count < maxCount; ++i) {
    if (output[keys[i]] !== undefined) {
      ++count;
    }
  }
  return count;
}
