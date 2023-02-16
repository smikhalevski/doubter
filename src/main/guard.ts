import { AnyShape, ArrayShape, Shape } from './shapes';
import { isArray } from './utils';
import { InferTuple } from './shapes/ArrayShape';
import { ERROR_ASYNC_DECORATOR } from './constants';

/**
 * Guards each argument of a function with a corresponding shape.
 *
 * ```
 * const callbackFactory = d.guard([d.string(), d.boolean()]);
 *
 * callbackFactory((arg1: string, arg2: boolean) => …);
 * ```
 *
 * @param argShapes The array of shapes that parse arguments.
 * @template U The arguments array.
 * @returns The factory that guards functions.
 */
export function guard<U extends readonly [AnyShape, ...AnyShape[]] | []>(
  argShapes: U
): <R, T = any>(
  callback: (this: T, ...args: InferTuple<U, 'output'>) => R
) => (this: T, ...args: InferTuple<U, 'input'>) => R;

/**
 * Guards a function arguments with an array/tuple shape.
 *
 * ```
 * const callbackFactory = d.guard(d.array(d.string()));
 *
 * callbackFactory((...args: string[]) => …);
 * ```
 *
 * @param argsShape The shape that parses an arguments array.
 * @template I The array of input arguments.
 * @template O The array of output arguments.
 * @returns The factory that guards functions.
 */
export function guard<I extends readonly any[], O extends readonly any[]>(
  argsShape: Shape<I, O>
): <R, T = any>(callback: (this: T, ...args: O) => R) => (this: T, ...args: I) => R;

/**
 * Guards an argument of an arity 1 function with a shape.
 *
 * ```
 * const callbackFactory = d.guard(d.string());
 *
 * callbackFactory((arg: string) => …);
 * ```
 *
 * @param argShape The shape that parses a single argument.
 * @template I The input argument.
 * @template O The output argument.
 * @returns The factory that guards functions.
 */
export function guard<I, O>(
  argShape: Shape<I, O>
): <R, T = any>(callback: (this: T, arg: O) => R) => (this: T, arg: I) => R;

/**
 * Guards each argument of a function with a corresponding shape.
 *
 * ```
 * const callback = d.guard(
 *   [d.string(), d.boolean()],
 *   (arg1: string, arg2: boolean) => …
 * );
 * ```
 *
 * @param argShapes The array of shapes that parse arguments.
 * @param callback The callback to guard.
 * @template U The arguments array.
 * @template R The returned value.
 * @template T The value of `this`.
 * @returns The guarded callback.
 */
export function guard<U extends readonly [AnyShape, ...AnyShape[]] | [], R, T = any>(
  argShapes: U,
  callback: (this: T, ...args: InferTuple<U, 'output'>) => R
): (this: T, ...args: InferTuple<U, 'input'>) => R;

/**
 * Guards a function arguments with an array/tuple shape.
 *
 * ```
 * const callback = d.guard(
 *   d.array(d.string()),
 *   (...args: string[]) => …
 * );
 * ```
 *
 * @param argsShape The shape that parses an arguments array.
 * @param callback The callback to guard.
 * @template I The array of input arguments.
 * @template O The array of output arguments.
 * @template R The returned value.
 * @template T The value of `this`.
 * @returns The guarded callback.
 */
export function guard<I extends readonly any[], O extends readonly any[], R, T = any>(
  argsShape: Shape<I, O>,
  callback: (this: T, ...args: O) => R
): (this: T, ...args: I) => R;

/**
 * Guards an argument of an arity 1 function with a shape.
 *
 * ```
 * const callback = d.guard(
 *   d.string(),
 *   (arg: string) => …
 * );
 * ```
 *
 * @param argShape The shape that parses a single argument.
 * @param callback The callback to guard.
 * @template I The input argument.
 * @template O The output argument.
 * @template R The returned value.
 * @template T The value of `this`.
 * @returns The guarded callback.
 */
export function guard<I, O, R, T = any>(
  argShape: Shape<I, O>,
  callback: (this: T, arg: O) => R
): (this: T, arg: I) => R;

export function guard(shape: any, callback?: (...args: any[]) => any) {
  if (isArray(shape)) {
    shape = new ArrayShape(shape, null);
  }
  if (!(shape instanceof ArrayShape)) {
    shape = new ArrayShape([shape], null);
  }
  if (shape.isAsync) {
    throw new Error(ERROR_ASYNC_DECORATOR);
  }

  const factory = (callback: Function) =>
    function (this: any, ...args: any[]) {
      return callback.apply(this, shape.parse(args));
    };

  return callback !== undefined ? factory(callback) : factory;
}

/**
 * Guards each argument of a function with a corresponding shape.
 *
 * ```
 * const callbackFactory = d.guardAsync([d.string(), d.boolean()]);
 *
 * callbackFactory((arg1: string, arg2: boolean) => …);
 * ```
 *
 * @param argShapes The array of shapes that parse arguments.
 * @template U The arguments array.
 * @returns The factory that guards functions.
 */
export function guardAsync<U extends readonly [AnyShape, ...AnyShape[]] | []>(
  argShapes: U
): <R, T = any>(
  callback: (this: T, ...args: InferTuple<U, 'output'>) => Promise<R> | R
) => (this: T, ...args: InferTuple<U, 'input'>) => Promise<R>;

/**
 * Guards a function arguments with an array/tuple shape.
 *
 * ```
 * const callbackFactory = d.guardAsync(d.array(d.string()));
 *
 * callbackFactory((...args: string[]) => …);
 * ```
 *
 * @param argsShape The shape that parses an arguments array.
 * @template I The array of input arguments.
 * @template O The array of output arguments.
 * @returns The factory that guards functions.
 */
export function guardAsync<I extends readonly any[], O extends readonly any[]>(
  argsShape: Shape<I, O>
): <R, T = any>(callback: (this: T, ...args: O) => Promise<R> | R) => (this: T, ...args: I) => Promise<R>;

/**
 * Guards an argument of an arity 1 function with a shape.
 *
 * ```
 * const callbackFactory = d.guardAsync(d.string());
 *
 * callbackFactory((arg: string) => …);
 * ```
 *
 * @param argShape The shape that parses a single argument.
 * @template I The input argument.
 * @template O The output argument.
 * @returns The factory that guards functions.
 */
export function guardAsync<I, O>(
  argShape: Shape<I, O>
): <R, T = any>(callback: (this: T, arg: O) => Promise<R> | R) => (this: T, arg: I) => Promise<R>;

/**
 * Guards each argument of a function with a corresponding shape.
 *
 * ```
 * const callback = d.guardAsync(
 *   [d.string(), d.boolean()],
 *   (arg1: string, arg2: boolean) => …
 * );
 * ```
 *
 * @param argShapes The array of shapes that parse arguments.
 * @param callback The callback to guard.
 * @template U The arguments array.
 * @template R The returned value.
 * @template T The value of `this`.
 * @returns The guarded callback.
 */
export function guardAsync<U extends readonly [AnyShape, ...AnyShape[]] | [], R, T = any>(
  argShapes: U,
  callback: (this: T, ...args: InferTuple<U, 'output'>) => Promise<R> | R
): (this: T, ...args: InferTuple<U, 'input'>) => Promise<R>;

/**
 * Guards a function arguments with an array/tuple shape.
 *
 * ```
 * const callback = d.guardAsync(
 *   d.array(d.string()),
 *   (...args: string[]) => …
 * );
 * ```
 *
 * @param argsShape The shape that parses an arguments array.
 * @param callback The callback to guard.
 * @template I The array of input arguments.
 * @template O The array of output arguments.
 * @template R The returned value.
 * @template T The value of `this`.
 * @returns The guarded callback.
 */
export function guardAsync<I extends readonly any[], O extends readonly any[], R, T = any>(
  argsShape: Shape<I, O>,
  callback: (this: T, ...args: O) => Promise<R> | R
): (this: T, ...args: I) => Promise<R>;

/**
 * Guards an argument of an arity 1 function with a shape.
 *
 * ```
 * const callback = d.guardAsync(
 *   d.string(),
 *   (arg: string) => …
 * );
 * ```
 *
 * @param argShape The shape that parses a single argument.
 * @param callback The callback to guard.
 * @template I The input argument.
 * @template O The output argument.
 * @template R The returned value.
 * @template T The value of `this`.
 * @returns The guarded callback.
 */
export function guardAsync<I, O, R, T = any>(
  argShape: Shape<I, O>,
  callback: (this: T, arg: O) => Promise<R> | R
): (this: T, arg: I) => Promise<R>;

export function guardAsync(shape: any, callback?: (...args: any[]) => any) {
  if (isArray(shape)) {
    shape = new ArrayShape(shape, null);
  }
  if (!(shape instanceof ArrayShape)) {
    shape = new ArrayShape([shape], null);
  }

  let factory: (callback: Function) => Function;

  if (shape.isAsync) {
    factory = callback =>
      function (this: any, ...args: any[]) {
        return shape.parseAsync(args).then((args: any[]) => callback.apply(this, shape.parse(args)));
      };
  } else {
    factory = callback =>
      function (this: any, ...args: any[]) {
        return new Promise(resolve => resolve(callback.apply(this, shape.parse(args))));
      };
  }

  return callback !== undefined ? factory(callback) : factory;
}
