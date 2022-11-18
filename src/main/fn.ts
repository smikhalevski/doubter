import { AnyShape, ArrayShape, Shape } from './shapes';
import * as d from './dsl';
import { isArray } from './utils';
import { MESSAGE_ERROR_ASYNC_GUARD } from './constants';
import type { InferTuple } from './shapes/ArrayShape';

export function fn<U extends readonly [AnyShape, ...AnyShape[]] | [], R, T = any>(
  shapes: U,
  callback: (this: T, ...args: InferTuple<U, 'output'>) => R
): (this: T, ...args: InferTuple<U, 'input'>) => R;

export function fn<I extends readonly any[], O extends readonly any[], R, T = any>(
  shape: Shape<I, O>,
  callback: (this: T, ...args: O) => R
): (this: T, ...args: I) => R;

export function fn(shape: any, callback: (...args: any[]) => any) {
  if (isArray(shape)) {
    shape = new ArrayShape(shape, null);
  }

  if (shape.async) {
    throw new Error(MESSAGE_ERROR_ASYNC_GUARD);
  }

  return function (this: any, ...args: any[]) {
    return callback.apply(this, shape.parse(args));
  };
}

export function fnAsync<U extends readonly [AnyShape, ...AnyShape[]] | [], R, T = any>(
  shapes: U,
  callback: (this: T, ...args: InferTuple<U, 'output'>) => Promise<R> | R
): (this: T, ...args: InferTuple<U, 'input'>) => Promise<R>;

export function fnAsync<I extends readonly any[], O extends readonly any[], R, T = any>(
  shape: Shape<I, O>,
  callback: (this: T, ...args: O) => Promise<R> | R
): (this: T, ...args: I) => Promise<R>;

export function fnAsync(shape: any, callback: (...args: any[]) => any) {
  if (isArray(shape)) {
    shape = new ArrayShape(shape, null);
  }

  if (shape.async) {
    return function (this: any, ...args: any[]) {
      return shape.parseAsync(args).then((args: any[]) => callback.apply(this, shape.parse(args)));
    };
  }

  return function (this: any, ...args: any[]) {
    return new Promise(resolve => resolve(callback.apply(this, shape.parse(args))));
  };
}

const fn2 = fnAsync([d.string(), d.boolean()], function (a, b) {
  return 123;
});

fn2('sad', true);
