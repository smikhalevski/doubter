/**
 * The module with the utility functions that can be used for plugin development.
 *
 * ```ts
 * import { createIssue } from 'doubter/utils';
 * ```
 *
 * @module utils
 */

import type { Issue, IssueOptions, Message, ParseOptions } from './core';

/**
 * Creates a new issue.
 *
 * @param code The issue code.
 * @param input The input value that caused an issue.
 * @param defaultMessage The default message that is used if there's no {@link IssueOptions.message}
 * @param param The issue param that is also passed to the message callback.
 * @param applyOptions The options passed to the {@link core!Shape._apply Shape._apply} or
 * {@link core!Shape._applyAsync Shape._applyAsync}
 * @param issueOptions The issue options or `undefined` if there's no specific issue options.
 */
export function createIssue(
  code: any,
  input: unknown,
  defaultMessage: Message,
  param: unknown,
  applyOptions: ParseOptions,
  issueOptions?: IssueOptions | Message
): Issue {
  const issue: Issue = { code, path: undefined, input, message: undefined, param, meta: undefined };

  let message;

  message =
    (issueOptions !== undefined &&
      ((message = issueOptions),
      typeof issueOptions === 'function' ||
        typeof issueOptions === 'string' ||
        ((issue.meta = issueOptions.meta), (message = issueOptions.message)) !== undefined)) ||
    (applyOptions !== undefined &&
      applyOptions.messages !== undefined &&
      (message = applyOptions.messages[code]) !== undefined)
      ? message
      : defaultMessage;

  if (
    (typeof message === 'function' && ((message = message(issue, applyOptions)), issue.message === undefined)) ||
    message !== undefined
  ) {
    issue.message = message;
  }
  return issue;
}
