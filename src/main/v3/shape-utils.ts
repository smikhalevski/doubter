import type { AnyShape, Shape } from './shapes/Shape';
import { Check, InputConstraintOptionsOrMessage, Issue, OutputConstraintOptionsOrMessage } from './shared-types';
import { isString } from './lang-utils';

/**
 * The convenient shortcut to add built-in constraints to shapes.
 */
export function addCheck<S extends Shape>(
  shape: S,
  id: string | undefined,
  options: OutputConstraintOptionsOrMessage | undefined,
  constraint: Check<S['output']>
): S {
  const unsafe = options != null && typeof options === 'object' ? options.unsafe : false;

  return shape.check(constraint, { id, unsafe });
}

export function isAsyncShapes(shapes: readonly AnyShape[]): boolean {
  let async = false;

  for (let i = 0; i < shapes.length && !async; ++i) {
    async = shapes[i].async;
  }
  return async;
}

export function toPartialIssue(
  message: unknown,
  options: InputConstraintOptionsOrMessage | undefined,
  param?: unknown
): { message: unknown; meta: unknown } {
  let meta;

  if (options !== null && typeof options === 'object') {
    if (options.message !== undefined) {
      message = options.message;
    }
    meta = options.meta;
  } else if (typeof options === 'function') {
    message = options;
  } else if (options != null) {
    message = String(options);
  }
  if (isString(message)) {
    message = message.replace('%s', param === undefined ? '' : String(param));
  }

  return { message, meta };
}

export function createIssue(code: string, input: unknown, message: unknown, param: unknown, meta: unknown): Issue {
  return { code, path: [], input, message, param, meta };
}

export function raiseIssue(
  issues: Issue[] | null,
  code: string,
  input: unknown,
  message: unknown,
  param: unknown,
  meta: unknown
): Issue[] {
  if (typeof message === 'function') {
    message = message(param, input);
  }

  const issue = createIssue(code, input, message, param, meta);

  if (issues === null) {
    issues = [issue];
  } else {
    issues.push(issue);
  }
  return issues;
}

export function unshiftKey(issues: Issue[], offset: number, key: unknown): Issue[] {
  for (let i = offset; i < issues.length; ++i) {
    issues[i].path.unshift(key);
  }
  return issues;
}
