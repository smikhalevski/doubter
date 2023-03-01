import { AnyShape, defaultParseOptions, Result, Shape, ValueType } from './Shape';
import { ConstraintOptions, Message, ParseOptions } from '../shared-types';
import { applyForResult, cloneObject, copyChecks, createIssueFactory, isArray, ok, unshiftPath } from '../utils';
import { CODE_TYPE, ERROR_ASYNC_DELEGATOR, MESSAGE_FUNCTION_TYPE, TYPE_FUNCTION } from '../constants';
import { ValidationError } from '../ValidationError';

// prettier-ignore
export type InferFunction<A extends Shape, R extends AnyShape | null, T extends AnyShape | null> =
  (this: T extends AnyShape ? T['output'] : any, ...args: A['output']) => R extends AnyShape ? R['input'] : any;

// prettier-ignore
export type InferDelegator<A extends Shape, R extends AnyShape | null, T extends AnyShape | null> =
  (this: T extends AnyShape ? T['input'] : any, ...args: A['input']) => R extends AnyShape ? R['output'] : any;

/**
 * @template A The shape of the array of arguments.
 * @template R The return value shape, or `null` if unconstrained.
 * @template T The shape of `this` argument, or `null` if unconstrained.
 */
export class FunctionShape<A extends Shape, R extends AnyShape | null, T extends AnyShape | null> extends Shape<
  InferFunction<A, R, T>,
  InferDelegator<A, R, T>
> {
  /**
   * `true` if the input functions aren't guarded by a delegator during parsing; `false` otherwise.
   */
  public isBare = false;

  protected _typeIssueFactory;
  protected _parseOptions = defaultParseOptions;

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
     * The shape of `this` argument, or `null` if unconstrained.
     */
    readonly thisShape: T,
    options?: ConstraintOptions | Message
  ) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_FUNCTION_TYPE, options, TYPE_FUNCTION);
  }

  /**
   * `true` if some shapes that describe the function signature are {@link Shape.isAsync async}, otherwise returns
   * `false`.
   */
  get isDelegatorAsync(): boolean {
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
   * Prevent input functions from being guarded by a delegator during parsing.
   *
   * @returns The new function shape.
   */
  bare(): this {
    const shape = cloneObject(this);
    shape.isBare = true;
    return shape;
  }

  /**
   * Set options that are used by the delegator to parse arguments, `this` and return values.
   *
   * @param options Parsing options.
   * @returns The new function shape.
   */
  options(options: ParseOptions): this {
    const shape = cloneObject(this);
    shape._parseOptions = options;
    return shape;
  }

  /**
   * Creates a delegator function that parses arguments and passes them to `fn`, and after `fn` synchronously returns
   * the result, the delegator parses it as well and returns.
   *
   * @param fn The underlying function that would receive a parsed arguments.
   * @param options Parsing options used by the delegator. By default, options set via {@linkcode options} are used.
   * @returns The delegator function.
   */
  delegate(fn: InferFunction<A, R, T>, options: ParseOptions = this._parseOptions): InferDelegator<A, R, T> {
    const { argsShape, returnShape, thisShape } = this;

    if (this.isDelegatorAsync) {
      throw new Error(ERROR_ASYNC_DELEGATOR);
    }

    return function (...args) {
      const result = fn.apply(
        thisShape !== null ? getOrDie(thisShape['_apply'](this, options), 'this', this) : this,
        getOrDie(argsShape['_apply'](args, options), 'arguments', args)
      );

      return returnShape !== null ? getOrDie(returnShape['_apply'](result, options), 'return', result) : result;
    };
  }

  /**
   * Creates a delegator function that parses arguments and passes them to `fn`, and after `fn` asynchronously returns
   * the result, the delegator parses it as well and returns.
   *
   * Use this method if {@link isDelegatorAsync some shapes that describe the function signature} are
   * {@link Shape.isAsync async}.
   *
   * @param fn The underlying function that would receive a parsed arguments.
   * @param options Parsing options used by the delegator. By default, options set via {@linkcode options} are used.
   * @returns The delegator function.
   */
  delegateAsync(
    fn: InferFunction<A, R extends AnyShape ? Shape<Promise<R['input']> | R['input'], never> : null, T>,
    options: ParseOptions = this._parseOptions
  ): InferDelegator<A, Shape<never, Promise<R extends AnyShape ? R['output'] : any>>, T> {
    const { argsShape, returnShape, thisShape } = this;

    return function (...args) {
      return new Promise(resolve => {
        let result;

        if (thisShape !== null) {
          result = applyForResult(thisShape, this, options, thisResult => {
            const thisValue = getOrDie(thisResult, 'this', this);

            return applyForResult(argsShape, args, options, argsResult =>
              fn.apply(thisValue, getOrDie(argsResult, 'arguments', args))
            );
          });
        } else {
          result = applyForResult(argsShape, args, options, argsResult =>
            fn.apply(this, getOrDie(argsResult, 'arguments', args))
          );
        }

        if (returnShape !== null) {
          result = Promise.resolve(result).then(result =>
            applyForResult(returnShape, result, options, resultResult => getOrDie(resultResult, 'return', result))
          );
        }

        resolve(result);
      });
    };
  }

  protected _getInputTypes(): readonly ValueType[] {
    return [TYPE_FUNCTION];
  }

  protected _apply(input: any, options: ParseOptions): Result<InferDelegator<A, R, T>> {
    const { _applyChecks } = this;

    let issues = null;

    if (typeof input !== 'function') {
      return this._typeIssueFactory(input, options);
    }
    if (_applyChecks === null || (issues = _applyChecks(input, null, options)) === null) {
      return this.isBare ? null : ok(this._delegate(input));
    }
    return issues;
  }

  // noinspection InfiniteRecursionJS
  private _delegate(fn: InferFunction<A, R, T>): InferDelegator<A, R, T> {
    this._delegate = this.isDelegatorAsync ? this.delegateAsync : this.delegate;
    return this._delegate(fn);
  }
}

function getOrDie<T>(result: Result<T>, part: 'this' | 'arguments' | 'return', input: any): T {
  if (result === null) {
    return input;
  }
  if (isArray(result)) {
    unshiftPath(result, part);
    throw new ValidationError(result);
  }
  return result.value;
}
