/**
 * The module with the utility functions that can be used for plugin development.
 *
 * ```ts
 * import { createIssueFactory } from 'doubter/utils';
 * ```
 *
 * @module utils
 */

import { ApplyOptions, Issue, IssueOptions, Message } from './core';
import { isObjectLike } from './internal/lang';

/**
 * Extracts options from the given source.
 *
 * @param source Options or message to extract from.
 */
export function toIssueOptions<T extends IssueOptions>(source: T | Message | undefined): Partial<T> {
  if (typeof source === 'function' || typeof source === 'string') {
    return { message: source, meta: undefined } as T;
  }
  if (isObjectLike(source)) {
    return source;
  }
  return { message: undefined, meta: undefined } as T;
}

export function createIssue(
  code: string,
  input: unknown,
  defaultMessage: Message,
  param: unknown,
  options: ApplyOptions,
  issueOptions: IssueOptions
): Issue {
  const issue: Issue = { code, path: undefined, input, message: undefined, param, meta: issueOptions.meta };

  let message = issueOptions.message;

  if (message === undefined) {
    message = defaultMessage;
  }

  message = typeof message === 'function' ? message(issue, options) : message;

  if (issue.message === undefined) {
    issue.message = message;
  }
  return issue;
}
