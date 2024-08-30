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
import { ReadonlyDict } from '../internal/objects';
import { Shape } from '../shape/Shape';
import { IssueOptions, Message } from '../types';
import { createIssue } from '../utils';

interface ObjectLikeShape extends Shape<any, any> {
  plain(options?: IssueOptions | Message): this;

  allKeys(keys: string[], options?: IssueOptions | Message): this;

  notAllKeys(keys: string[], options?: IssueOptions | Message): this;

  orKeys(keys: string[], options?: IssueOptions | Message): this;

  xorKeys(keys: string[], options?: IssueOptions | Message): this;

  oxorKeys(keys: string[], options?: IssueOptions | Message): this;
}

export function enableObjectLikeEssentials(ctor: { prototype: ObjectLikeShape }): void {
  ctor.prototype.plain = function (issueOptions) {
    return this.addOperation(
      (value, param, options) => {
        const prototype = Object.getPrototypeOf(value);

        if (prototype === null || prototype.constructor === Object) {
          return null;
        }
        return [createIssue(CODE_OBJECT_PLAIN, value, MESSAGE_OBJECT_PLAIN, param, options, issueOptions)];
      },
      { type: CODE_OBJECT_PLAIN }
    );
  };

  ctor.prototype.allKeys = function (keys, issueOptions) {
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

  ctor.prototype.notAllKeys = function (keys, issueOptions) {
    return this.addOperation(
      (value, param, options) => {
        if (getKeyCount(value, param, param.length) !== param.length) {
          return null;
        }
        return [
          createIssue(CODE_OBJECT_NOT_ALL_KEYS, value, MESSAGE_OBJECT_NOT_ALL_KEYS, param, options, issueOptions),
        ];
      },
      { type: CODE_OBJECT_NOT_ALL_KEYS, param: keys }
    );
  };

  ctor.prototype.orKeys = function (keys, issueOptions) {
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

  ctor.prototype.xorKeys = function (keys, issueOptions) {
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

  ctor.prototype.oxorKeys = function (keys, issueOptions) {
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
