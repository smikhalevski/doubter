import { ApplyOptions, CheckCallback, ConstraintOptions, Issue, Message, Output, Shape } from './core';
import { isObjectLike } from './internal';

/**
 * The shortcut to add built-in checks to shapes.
 */
export function addCheck<S extends Shape, P>(shape: S, key: string, param: P, cb: CheckCallback<Output<S>, P>): S {
  return shape.check(cb, { key, param, unsafe: true });
}

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
  options: ConstraintOptions | Message | undefined,
  param: unknown
): (input: unknown, options: Readonly<ApplyOptions>) => Issue[];

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
  options: ConstraintOptions | Message | undefined
): (input: unknown, options: Readonly<ApplyOptions>, param: unknown) => Issue[];

export function createIssueFactory(
  code: unknown,
  defaultMessage: any,
  options: ConstraintOptions | Message | undefined,
  param?: unknown
): (input: unknown, options: Readonly<ApplyOptions>, param: unknown) => Issue[] {
  const paramRequired = arguments.length <= 3;

  let meta: unknown;
  let message = defaultMessage;

  if (isObjectLike<ConstraintOptions>(options)) {
    if (options.message !== undefined) {
      message = options.message;
    }
    meta = options.meta;
  } else if (typeof options === 'function') {
    message = options;
  } else if (options !== undefined) {
    message = options;
  }

  if (typeof message === 'function') {
    if (paramRequired) {
      return (input, options, param) => [
        { code, path: undefined, input, message: message(param, code, input, meta, options), param, meta },
      ];
    }

    return (input, options) => [
      { code, path: undefined, input, message: message(param, code, input, meta, options), param, meta },
    ];
  }

  if (typeof message === 'string') {
    if (paramRequired) {
      if (message.indexOf('%s') !== -1) {
        return (input, options, param) => [
          { code, path: undefined, input, message: message.replace('%s', String(param)), param, meta },
        ];
      }
    } else {
      message = message.replace('%s', String(param));
    }
  }

  if (paramRequired) {
    return (input, options, param) => [{ code, path: undefined, input, message, param, meta }];
  }

  return input => [{ code, path: undefined, input, message, param, meta }];
}
