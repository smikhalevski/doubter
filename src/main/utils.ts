import { ApplyOptions, ConstraintOptions, Issue, Message, MessageCallback } from './core';

/**
 * Returns a function that creates a new array with a single issue.
 *
 * @param code The code of the issue.
 * @param defaultMessage The default message that is used if message isn't provided through options.
 * @param options Options provided by the user.
 * @param param The param that is added to the issue.
 * @returns The callback that takes an input and options, and returns an array with a single issue.
 */
export function createIssueFactory(
  code: unknown,
  defaultMessage: unknown,
  options: ConstraintOptions | Message | null | undefined,
  param: unknown
): (input: unknown, options: Readonly<ApplyOptions>) => Issue;

/**
 * Returns a function that creates a new array with a single issue.
 *
 * @param code The code of the issue.
 * @param defaultMessage The default message that is used if message isn't provided through options.
 * @param options Options provided by the user.
 * @returns The callback that takes an input, options, and a param, and returns an array with a single issue.
 */
export function createIssueFactory(
  code: unknown,
  defaultMessage: unknown,
  options: ConstraintOptions | Message | null | undefined
): (input: unknown, options: Readonly<ApplyOptions>, param: unknown) => Issue;

export function createIssueFactory(
  code: unknown,
  defaultMessage: unknown,
  options: ConstraintOptions | Message | null | undefined,
  param?: unknown
): (input: unknown, options: Readonly<ApplyOptions>, param: unknown) => Issue {
  const parameterized = arguments.length <= 3;

  let message: any = options;
  let meta: any;

  if (options !== null && typeof options === 'object') {
    message = options.message;
    meta = options.meta;
  }

  if (message === undefined) {
    message = defaultMessage;
  }

  if (typeof message === 'function') {
    const cb: MessageCallback = message;

    if (parameterized) {
      return (input, options, param) => {
        const issue = { code, path: undefined, input, message: undefined, param, meta };
        const message = cb(issue, options);

        if (issue.message === undefined) {
          issue.message = message;
        }
        return issue;
      };
    }

    return (input, options) => {
      const issue = { code, path: undefined, input, message: undefined, param, meta };
      const message = cb(issue, options);

      if (issue.message === undefined) {
        issue.message = message;
      }
      return issue;
    };
  }

  if (typeof message === 'string') {
    if (parameterized) {
      if (message.indexOf('%s') !== -1) {
        return (input, options, param) => {
          return { code, path: undefined, input, message: message.replace('%s', String(param)), param, meta };
        };
      }
    } else {
      message = message.replace('%s', String(param));
    }
  }

  if (parameterized) {
    return (input, options, param) => {
      return { code, path: undefined, input, message, param, meta };
    };
  }

  return (input, options) => {
    return { code, path: undefined, input, message, param, meta };
  };
}
