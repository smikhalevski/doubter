import { CODE_TYPE, ERROR_ASYNC_FUNCTION, MESSAGE_FUNCTION_TYPE } from '../constants';
import { TYPE_FUNCTION } from '../Type';
import { ApplyOptions, ConstraintOptions, Message, ParseOptions } from '../types';
import { applyShape, copyChecks, createIssueFactory, getErrorMessage, isArray, ok, unshiftIssuesPath } from '../utils';
import { ValidationError } from '../ValidationError';
import { AnyShape, defaultApplyOptions, Input, Output, Result, Shape } from './Shape';

type InferThis<F> = F extends (this: infer T, ...args: any[]) => any ? T : any;

// prettier-ignore
type TryInput<S extends AnyShape | null | undefined, T = any> =
  S extends null | undefined ? T : S extends AnyShape ? Input<S> : T;

// prettier-ignore
type TryOutput<S extends AnyShape | null | undefined, T = any> =
  S extends null | undefined ? T : S extends AnyShape ? Output<S> : T;

// prettier-ignore
type Awaited<T> =
  T extends null | undefined ? T :
  T extends object & { then(fn: infer F, ...args: any): any }
    ? F extends (value: infer V, ...args: any) => any ? Awaited<V> : never
    : T;

type Promisify<T> = Promise<Awaited<T>>;

type Awaitable<T> = T extends Awaited<T> ? Awaited<T> | Promisify<T> : Promisify<T>;

/**
 * The shape of the function value.
 *
 * @template A The shape of the array of arguments.
 * @template R The return value shape, or `null` if unconstrained.
 * @template T The shape of `this` argument, or `null` if unconstrained.
 */
export class FunctionShape<
  A extends Shape<readonly any[], readonly any[]>,
  R extends AnyShape | null,
  T extends AnyShape | null
> extends Shape<
  (this: TryOutput<T>, ...args: Output<A>) => TryInput<R>,
  (this: TryInput<T>, ...args: Input<A>) => TryOutput<R>
> {
  /**
   * `true` if input functions are wrapped during parsing to ensure runtime signature type-safety, or `false` otherwise.
   */
  isStrict = false;

  protected _typeIssueFactory;

  /**
   * Parsing options that are used by a wrapper.
   */
  protected _parseOptions: Readonly<ParseOptions> | undefined;

  /**
   * Creates a new {@linkcode FunctionShape} instance.
   *
   * @param argsShape The shape of the array of arguments.
   * @param returnShape The return value shape, or `null` if unconstrained.
   * @param thisShape The shape of `this` argument, or `null` if unconstrained.
   * @param options The type constraint options or the type issue message.
   */
  constructor(
    /**
     * The shape of the array of arguments.
     */
    readonly argsShape: A,
    /**
     * The return value shape, or `null` if unconstrained.
     */
    readonly returnShape: R,
    /**
     * The shape of `this` value, or `null` if unconstrained.
     */
    readonly thisShape: T,
    options?: ConstraintOptions | Message
  ) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_FUNCTION_TYPE, options, TYPE_FUNCTION);
  }

  /**
   * `true` if some shapes that describe the function signature are {@link Shape.isAsync async}, or `false` otherwise.
   */
  get isAsyncSignature(): boolean {
    return this.returnShape?.isAsync || this.thisShape?.isAsync || this.argsShape.isAsync;
  }

  /**
   * Constrains the function return value with the given shape.
   *
   * @param shape The return value shape, or `null` if unconstrained.
   * @returns The new function shape.
   * @template S The return value shape.
   */
  return<S extends AnyShape | null>(shape: S): FunctionShape<A, S, T> {
    return copyChecks(this, new FunctionShape(this.argsShape, shape, this.thisShape));
  }

  /**
   * Constrains the type of `this` inside the function.
   *
   * @param shape The shape of `this` argument, or `null` if unconstrained.
   * @returns The new function shape.
   * @template S The shape of `this` argument.
   */
  this<S extends AnyShape | null>(shape: S): FunctionShape<A, R, S> {
    return copyChecks(this, new FunctionShape(this.argsShape, this.returnShape, shape));
  }

  /**
   * Enables input function wrapping during parsing to ensure runtime signature type-safety. Wrapper ensures that input
   * function receives arguments and `this` values that conform {@linkcode argsShape} and {@linkcode thisShape}
   * respectively, and returns the value that conforms {@link returnShape}.
   *
   * @param options Options that are used by the wrapper. If omitted then default options are applied: not verbose, no
   * type coercion.
   * @returns The new function shape.
   */
  strict(options?: ParseOptions): this {
    const shape = this._clone();
    shape.isStrict = true;
    shape._parseOptions = options;
    return shape;
  }

  /**
   * Wraps a function to ensure runtime signature type-safety. The returned wrapper function ensures that `fn` receives
   * arguments and `this` values that conform {@linkcode argsShape} and {@linkcode thisShape} respectively, and
   * _synchronously_ returns the value that conforms {@link returnShape}.
   *
   * @param fn The underlying function.
   * @param options Parsing options used by the wrapper. By default, options provided to {@linkcode strict} are used.
   * @returns The wrapper function.
   */
  ensureSignature<F extends (this: TryOutput<T>, ...args: Output<A>) => TryInput<R>>(
    fn: F,
    options?: Readonly<ParseOptions>
  ): (this: TryInput<T, InferThis<F>>, ...args: Input<A>) => TryOutput<R, ReturnType<F>>;

  ensureSignature(fn: Function, options = this._parseOptions || defaultApplyOptions) {
    const { argsShape, returnShape, thisShape } = this;

    if (this.isAsyncSignature) {
      throw new Error(ERROR_ASYNC_FUNCTION);
    }

    return function (this: any, ...args: any) {
      const result = fn.apply(
        thisShape !== null ? getOrDie('this', thisShape['_apply'](this, options), this, options) : this,
        getOrDie('arguments', argsShape['_apply'](args, options), args, options)
      );

      if (returnShape !== null) {
        return getOrDie('return', returnShape['_apply'](result, options), result, options);
      }

      return result;
    };
  }

  /**
   * Wraps a function to ensure runtime signature type-safety. The returned wrapper function ensures that `fn` receives
   * arguments and `this` values that conform {@linkcode argsShape} and {@linkcode thisShape} respectively, and
   * _asynchronously_ returns the value that conforms {@link returnShape}.
   *
   * Use this method if {@link isAsyncSignature some shapes that describe the function signature} are
   * {@link Shape.isAsync async}.
   *
   * @param fn The underlying function.
   * @param options Parsing options used by the wrapper. By default, options provided to {@linkcode strict} are used.
   * @returns The wrapper function.
   */
  ensureAsyncSignature<F extends (this: TryOutput<T>, ...args: Output<A>) => Awaitable<TryInput<R>>>(
    fn: F,
    options?: Readonly<ParseOptions>
  ): (this: TryInput<T, InferThis<F>>, ...args: Input<A>) => Promisify<TryOutput<R, ReturnType<F>>>;

  ensureAsyncSignature(fn: Function, options = this._parseOptions || defaultApplyOptions) {
    const { argsShape, returnShape, thisShape } = this;

    return function (this: any, ...args: any) {
      return new Promise(resolve => {
        let result;

        if (thisShape !== null) {
          result = applyShape(thisShape, this, options, thisResult => {
            const thisValue = getOrDie('this', thisResult, this, options);

            return applyShape(argsShape, args, options, argsResult =>
              fn.apply(thisValue, getOrDie('arguments', argsResult, args, options))
            );
          });
        } else {
          result = applyShape(argsShape, args, options, argsResult =>
            fn.apply(this, getOrDie('arguments', argsResult, args, options))
          );
        }

        if (returnShape !== null) {
          result = Promise.resolve(result).then(result =>
            applyShape(returnShape, result, options, resultResult => getOrDie('return', resultResult, result, options))
          );
        }

        resolve(result);
      });
    };
  }

  protected _getInputs(): unknown[] {
    return [TYPE_FUNCTION];
  }

  protected _apply(input: any, options: ApplyOptions): Result<(this: TryInput<T>, ...args: Input<A>) => TryOutput<R>> {
    const { _applyChecks } = this;

    let issues = null;

    if (typeof input !== 'function') {
      return this._typeIssueFactory(input, options);
    }
    if (_applyChecks !== null && (issues = _applyChecks(input, null, options)) !== null) {
      return issues;
    }
    if (this.isStrict) {
      return ok<any>(this.isAsyncSignature ? this.ensureAsyncSignature(input) : this.ensureSignature(input));
    }
    return null;
  }
}

function getOrDie<T>(key: 'this' | 'arguments' | 'return', result: Result<T>, input: any, options: ParseOptions): T {
  if (result === null) {
    return input;
  }
  if (isArray(result)) {
    unshiftIssuesPath(result, key);
    throw new ValidationError(result, getErrorMessage(result, input, options));
  }
  return result.value;
}
