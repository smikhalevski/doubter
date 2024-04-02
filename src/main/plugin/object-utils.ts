import {
  CODE_OBJECT_ALL_KEYS,
  CODE_OBJECT_NOT_ALL_KEYS,
  CODE_OBJECT_OR_KEYS,
  CODE_OBJECT_OXOR_KEYS,
  CODE_OBJECT_PLAIN,
  CODE_OBJECT_XOR_KEYS,
} from '../constants';
import { ReadonlyDict } from '../internal/objects';
import { Messages } from '../messages';
import { Shape } from '../shape/Shape';
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
}

interface ObjectLikeShape extends Shape<any, any> {
  plain(options?: IssueOptions | Message): this;

  allKeys(keys: string[], options?: IssueOptions | Message): this;

  notAllKeys(keys: string[], options?: IssueOptions | Message): this;

  orKeys(keys: string[], options?: IssueOptions | Message): this;

  xorKeys(keys: string[], options?: IssueOptions | Message): this;

  oxorKeys(keys: string[], options?: IssueOptions | Message): this;
}

export function enableObjectLikeEssentials(ctor: { messages: Messages; prototype: ObjectLikeShape }): void {
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

function getKeyCount(output: ReadonlyDict, keys: readonly string[], maxCount: number): number {
  let count = 0;

  for (let i = 0; i < keys.length && count < maxCount; ++i) {
    if (output[keys[i]] !== undefined) {
      ++count;
    }
  }
  return count;
}
