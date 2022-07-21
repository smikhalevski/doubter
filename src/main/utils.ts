import { AnyType } from './types/Type';
import { ParserContext } from './ParserContext';
import { Issue, KnownIssueCode } from './shared-types';

export function isObjectLike(value: unknown): value is Record<keyof any, any> {
  return value !== null && typeof value === 'object';
}

export function isAsync(types: Array<AnyType>): boolean {
  let async = false;

  for (let i = 0; i < types.length && !async; ++i) {
    async = types[i].isAsync();
  }
  return async;
}

export function createIssue(context: ParserContext, code: KnownIssueCode | string, input: any, param?: any): Issue {
  return { code, path: context.getPath(), input, param };
}

export function shallowClone<T extends object>(obj: T): T {
  return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
}

export function toPromise<T>(value: Promise<T> | T): Promise<T> {
  return value instanceof Promise ? value : Promise.resolve(value);
}

export function callOrChain<I, O>(value: Promise<I> | I, next: (value: I) => O): Promise<O> | O {
  return value instanceof Promise ? value.then(next) : next(value);
}
