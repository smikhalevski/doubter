import { ApplyOptions, ConstraintOptions, Issue, Message } from './core';

/**
 * Returns a function that creates an issue.
 *
 * @param code The code of the issue.
 * @param defaultMessage The default message that is used if message isn't provided through options.
 * @param options Options provided by the user.
 * @param param The param that is added to the issue.
 * @returns The callback that takes an input and options, and returns an issue.
 */
export function createIssueFactory(
  code: unknown,
  defaultMessage: unknown,
  options: ConstraintOptions | Message | undefined,
  param: unknown
): (input: unknown, options: Readonly<ApplyOptions>) => Issue;

/**
 * Returns a function that creates an issue.
 *
 * @param code The code of the issue.
 * @param defaultMessage The default message that is used if message isn't provided through options.
 * @param options Options provided by the user.
 * @returns The callback that takes an input, options, and a param, and returns an issue.
 */
export function createIssueFactory(
  code: unknown,
  defaultMessage: unknown,
  options: ConstraintOptions | Message | undefined
): (input: unknown, options: Readonly<ApplyOptions>, param: unknown) => Issue;

export function createIssueFactory(
  code: unknown,
  defaultMessage: unknown,
  options: ConstraintOptions | Message | undefined,
  param?: unknown
): (input: unknown, options: Readonly<ApplyOptions>, param: unknown) => Issue {
  const parameterized = arguments.length <= 3;

  let message: any;
  let meta: any;

  if (options !== null) {
    if (typeof options === 'function' || typeof options === 'string') {
      message = options;
    }
    if (typeof options === 'object') {
      message = options.message;
      meta = options.meta;
    }
  }

  if (message === undefined) {
    message = defaultMessage;
  }

  if (typeof message === 'function') {
    return (input, options, param0) => {
      const issue = { code, path: undefined, input, message: undefined, param: parameterized ? param0 : param, meta };
      const value = message(issue, options);

      if (issue.message === undefined) {
        issue.message = value;
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

  return (input, options, param0) => {
    return { code, path: undefined, input, message, param: parameterized ? param0 : param, meta };
  };
}
