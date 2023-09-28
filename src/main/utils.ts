/**
 * The module with the utility functions that can be used for plugin development.
 *
 * ```ts
 * import { createIssueFactory } from 'doubter/utils';
 * ```
 *
 * @module utils
 */

import { ApplyOptions, Issue, IssueOptions, Message, MessageCallback } from './core';
import { isObjectLike } from './internal/lang';

/**
 * Extracts options from the given source.
 *
 * @param source Options or message to extract from.
 */
export function extractOptions<T extends IssueOptions>(source: T | Message | undefined): Partial<T> {
  if (typeof source === 'function' || typeof source === 'string') {
    return { message: source } as T;
  }
  if (isObjectLike(source)) {
    return source;
  }
  return {};
}

/**
 * Returns a function that creates an issue.
 *
 * @param code The code of the issue.
 * @param defaultMessage The default message that is used if message isn't provided through options.
 * @param options The issue options or the issue message.
 * @param param The param that is added to the issue.
 * @returns The callback that takes an input and options, and returns an issue.
 */
export function createIssueFactory(
  code: unknown,
  defaultMessage: unknown,
  options: IssueOptions | Message | undefined,
  param: unknown
): (input: unknown, options: ApplyOptions) => Issue;

/**
 * Returns a function that creates an issue.
 *
 * @param code The code of the issue.
 * @param defaultMessage The default message that is used if message isn't provided through options.
 * @param options The issue options or the issue message.
 * @returns The callback that takes an input, options, and a param, and returns an issue.
 */
export function createIssueFactory(
  code: unknown,
  defaultMessage: unknown,
  options: IssueOptions | Message | undefined
): (input: unknown, options: ApplyOptions, param: unknown) => Issue;

export function createIssueFactory(
  code: unknown,
  defaultMessage: any,
  options: IssueOptions | Message | undefined,
  param?: unknown
): (input: unknown, options: ApplyOptions, param: unknown) => Issue {
  const parameterized = arguments.length <= 3;

  let { message = defaultMessage, meta } = extractOptions(options);

  if (typeof message === 'function') {
    return (input, options, param0) => {
      const issue = { code, path: undefined, input, message: undefined, param: parameterized ? param0 : param, meta };
      const value = (message as MessageCallback)(issue, options);

      if (issue.message === undefined) {
        issue.message = value;
      }
      return issue;
    };
  }

  if (typeof message === 'string') {
    if (parameterized) {
      if (message.indexOf('%s') !== -1) {
        return (input, options, param0) => {
          return { code, path: undefined, input, message: message.replace('%s', String(param0)), param: param0, meta };
        };
      }
    } else {
      message = message.replace('%s', String(param));
    }
  }

  if (parameterized) {
    return (input, options, param0) => {
      return { code, path: undefined, input, message, param: param0, meta };
    };
  }

  return (input, options) => {
    return { code, path: undefined, input, message, param, meta };
  };
}
