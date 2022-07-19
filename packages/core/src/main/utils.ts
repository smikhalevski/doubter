import { Type } from './types/Type';
import { ParserContext } from './ParserContext';
import { Issue } from './shared-types';

export function isAsync(types: Type[]): boolean {
  let async = false;

  for (let i = 0; i < types.length && !async; ++i) {
    async = types[i].isAsync();
  }
  return async;
}

export function createIssue(context: ParserContext, code: string, value: any, param?: any): Issue {
  return { code, path: context.getPath(), value, param };
}
