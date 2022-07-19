import { Type } from './types/Type';
import { ParserContext } from './ParserContext';
import { Issue } from './shared-types';

export function isObjectLike(value: unknown): value is object {
  return value !== null && typeof value === 'object';
}

export function isAsync(types: Type[]): boolean {
  let async = false;

  for (let i = 0; i < types.length && !async; ++i) {
    async = types[i].isAsync();
  }
  return async;
}

export function createIssue(context: ParserContext, code: string, input: any, param?: any): Issue {
  return { code, path: context.getPath(), input, param };
}
