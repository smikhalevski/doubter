import type { AnyShape } from './shapes/Shape';
import { Issue } from './shared-types';

export function isAsyncShapes(shapes: readonly AnyShape[]): boolean {
  let async = false;

  for (let i = 0; i < shapes.length && !async; ++i) {
    async = shapes[i].async;
  }
  return async;
}

export function raiseIssue(issues: Issue[] | null, code: string): Issue[] {
  if (issues === null) {
    issues = [];
  }
  issues.push({ code, path: [], input: null, message: null, param: null, meta: null });
  return issues;
}
