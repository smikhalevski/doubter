import type { AnyShape, CheckConfig, Shape } from './shapes/Shape';
import { Check, CheckOptions, Issue, Message } from './shared-types';

/**
 * The convenient shortcut to add built-in checks to shapes.
 */
export function addCheck<S extends Shape>(
  shape: S,
  id: string | undefined,
  options: CheckOptions | Message | undefined,
  check: Check<S['output']>
): S {
  const unsafe = options != null && typeof options === 'object' ? options.unsafe : false;

  return shape.check(check, { id, unsafe });
}

export function isAsyncShapes(shapes: readonly AnyShape[]): boolean {
  let async = false;

  for (let i = 0; i < shapes.length && !async; ++i) {
    async = shapes[i].async;
  }
  return async;
}

export function createIssue(config: CheckConfig, input: unknown, param: unknown): Issue {
  let { code, message, meta } = config;
  if (typeof message === 'function') {
    message = message(param, input);
  }
  return { code, path: [], input, message, param, meta };
}

export function raiseIssue(config: CheckConfig, input: unknown): Issue[] {
  return [createIssue(config, input, config.param)];
}

export function prependKey(issues: Issue[], key: unknown): void {
  let issuesLength = issues.length;
  for (let i = 0; i < issuesLength; ++i) {
    issues[i].path.unshift(key);
  }
}

export function concatIssues(issues: Issue[] | null, result: Issue[]): Issue[] {
  if (issues !== null) {
    issues.push(...result);
    return issues;
  }
  return result;
}

export function pushIssue(issues: Issue[] | null, result: Issue): Issue[] {
  if (issues !== null) {
    issues.push(result);
    return issues;
  }
  return [result];
}
