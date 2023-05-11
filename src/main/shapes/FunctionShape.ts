import { CODE_TYPE, ERROR_ASYNC_FUNCTION, MESSAGE_FUNCTION_TYPE } from '../constants';
import { TYPE_FUNCTION } from '../Type';
import { ApplyOptions, ConstraintOptions, Message, ParseOptions } from '../types';
import { applyShape, copyChecks, createIssueFactory, getErrorMessage, isArray, ok, unshiftIssuesPath } from '../utils';
import { ValidationError } from '../ValidationError';
import { AnyShape, defaultApplyOptions, INPUT, OUTPUT, Result, Shape } from './Shape';

// prettier-ignore
export type InferInputFunction<A extends Shape, R extends AnyShape | null, T extends AnyShape | null> =
  (this: T extends AnyShape ? T[OUTPUT] : any, ...args: A[OUTPUT]) => R extends AnyShape ? R[INPUT] : any;

// prettier-ignore
export type InferOutputFunction<A extends Shape, R extends AnyShape | null, T extends AnyShape | null> =
  (this: T extends AnyShape ? T[INPUT] : any, ...args: A[INPUT]) => R extends AnyShape ? R[OUTPUT] : any;

/**
 * The shape of the function value.
 *
 * @template A The shape of the array of arguments.
 * @template R The return value shape, or `null` if unconstrained.
 * @template T The shape of `this` argument, or `null` if unconstrained.
 */
export class FunctionShape<A extends Shape, R extends AnyShape | null, T extends AnyShape | null> extends Shape<
  InferInputFunction<A, R, T>,
  InferOutputFunction<A, R, T>
> {
  /**
   * `true` if input functions are wrapped during parsing with a signature insurance wrapper, or `false` otherwise.
   */
  isInsured = false;

  protected _typeIssueFactory;
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
   * `true` if some shapes that describe the insured function signature are {@link Shape.isAsync async}, or `false`
   * otherwise.
   */
  get isAsyncFunction(): boolean {
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
   * Wrap input functions in a signature insurance wrapper during parsing. This causes arguments, `this` and return
   * values to conform the respective shapes.
   *
   * @param options Options that are used by the signature insurance wrapper to parse arguments, `this` and return
   * values. If omitted then default options are applied: not verbose, no type coercion.
   * @returns The new function shape.
   */
  insure(options?: ParseOptions): this {
    const shape = this._clone();
    shape.isInsured = true;
    shape._parseOptions = options;
    return shape;
  }

  /**
   * Wraps a function in a signature insurance wrapper that parses arguments and `this` value, and passes them to `fn`.
   * And after `fn` _synchronously_ returns the result, the wrapper parses it as well and returns.
   *
   * @param fn The underlying function that would receive parsed arguments.
   * @param options Parsing options used by the wrapper. By default, options provided to {@linkcode insure} are used.
   * @returns The wrapper function.
   */
  insureFunction(
    fn: InferInputFunction<A, R, T>,
    options = this._parseOptions || defaultApplyOptions
  ): InferOutputFunction<A, R, T> {
    const { argsShape, returnShape, thisShape } = this;

    if (this.isAsyncFunction) {
      throw new Error(ERROR_ASYNC_FUNCTION);
    }

    return function (...args) {
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
   * Wraps a function in a signature insurance wrapper that parses arguments and `this` value, and passes them to `fn`.
   * And after `fn` _asynchronously_ returns the result, the wrapper parses it as well and returns.
   *
   * Use this method if {@link isAsyncFunction some shapes that describe the function signature} are
   * {@link Shape.isAsync async}.
   *
   * @param fn The underlying function that would receive parsed arguments.
   * @param options Parsing options used by the wrapper. By default, options provided to {@linkcode insure} are used.
   * @returns The wrapper function.
   */
  insureAsyncFunction(
    fn: InferInputFunction<A, R extends AnyShape ? Shape<Promise<R[INPUT]> | R[INPUT], never> : null, T>,
    options = this._parseOptions || defaultApplyOptions
  ): InferOutputFunction<A, Shape<never, Promise<R extends AnyShape ? R[OUTPUT] : any>>, T> {
    const { argsShape, returnShape, thisShape } = this;

    return function (...args) {
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

  protected _apply(input: any, options: ApplyOptions): Result<InferOutputFunction<A, R, T>> {
    const { _applyChecks } = this;

    let issues = null;

    if (typeof input !== 'function') {
      return this._typeIssueFactory(input, options);
    }
    if (_applyChecks === null || (issues = _applyChecks(input, null, options)) === null) {
      return this.isInsured ? ok(this._insure(input)) : null;
    }
    return issues;
  }

  // noinspection InfiniteRecursionJS
  private _insure(fn: InferInputFunction<A, R, T>): InferOutputFunction<A, R, T> {
    this._insure = this.isAsyncFunction ? this.insureAsyncFunction : this.insureFunction;
    return this._insure(fn);
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
