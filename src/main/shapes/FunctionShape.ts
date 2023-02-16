import { AnyShape, ApplyResult, Shape, ValueType } from './Shape';
import { ConstraintOptions, Message, ParseOptions } from '../shared-types';
import { cloneObject, copyChecks, createIssueFactory, ok } from '../utils';
import { CODE_TYPE, ERROR_ASYNC_DECORATOR, MESSAGE_FUNCTION_TYPE, TYPE_FUNCTION } from '../constants';

// prettier-ignore
export type InferFunction<A extends Shape, R extends AnyShape | null, T extends AnyShape | null> =
  (this: T extends AnyShape ? T['output'] : any, ...args: A['output']) => R extends AnyShape ? R['input'] : any;

// prettier-ignore
export type InferDecorator<A extends Shape, R extends AnyShape | null, T extends AnyShape | null> =
  (this: T extends AnyShape ? T['input'] : any, ...args: A['input']) => R extends AnyShape ? R['output'] : any;

/**
 * @template A The shape of the array of arguments.
 * @template R The return value shape, or `null` if return value is unconstrained.
 * @template T The shape of `this` value, or `null` if `this` value is unconstrained.
 */
export class FunctionShape<A extends Shape, R extends AnyShape | null, T extends AnyShape | null> extends Shape<
  InferFunction<A, R, T>,
  InferDecorator<A, R, T>
> {
  protected _typeIssueFactory;
  protected _bare = false;

  /**
   * Creates a new {@linkcode FunctionShape} instance.
   *
   * @param argsShape The shape of the array of arguments.
   * @param returnShape The return value shape, or `null` if return value is unconstrained.
   * @param thisShape The shape of `this` value, or `null` if `this` value is unconstrained.
   * @param options The type constraint options or the type issue message.
   */
  constructor(
    /**
     * The shape of the array of arguments.
     */
    readonly argsShape: A,
    /**
     * The return value shape, or `null` if return value is unconstrained.
     */
    readonly returnShape: R,
    /**
     * The shape of `this` value, or `null` if `this` value is unconstrained.
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
  get isDecoratorAsync(): boolean {
    return this.argsShape.isAsync || this.returnShape?.isAsync || this.thisShape?.isAsync || false;
  }

  /**
   * Constrains the function return value with the given shape.
   *
   * @param shape The return value shape, or `null` if return value is unconstrained.
   * @returns The new function shape.
   * @template S The return value shape.
   */
  return<S extends AnyShape | null>(shape: S): FunctionShape<A, S, T> {
    return copyChecks(this, new FunctionShape(this.argsShape, shape, this.thisShape));
  }

  /**
   * Constrains the type of `this` inside the function.
   *
   * @param shape The shape of `this` value, or `null` if `this` value is unconstrained.
   * @returns The new function shape.
   * @template S The shape of `this` value.
   */
  this<S extends AnyShape | null>(shape: S): FunctionShape<A, R, S> {
    return copyChecks(this, new FunctionShape(this.argsShape, this.returnShape, shape));
  }

  /**
   * Prevent input functions from being decorated during parsing.
   *
   * @returns The new function shape.
   */
  bare(): this {
    const shape = cloneObject(this);
    shape._bare = true;
    return shape;
  }

  /**
   * Creates a decorator function that parses arguments and passes them to `fn`, and after `fn` synchronously returns
   * the result, the decorator parses it as well and returns.
   *
   * @param fn The underlying function that would receive a parsed arguments.
   * @returns The decorator function.
   */
  decorate(fn: InferFunction<A, R, T>): InferDecorator<A, R, T> {
    const { argsShape, returnShape, thisShape } = this;

    if (this.isDecoratorAsync) {
      throw new Error(ERROR_ASYNC_DECORATOR);
    }

    return function (...args) {
      const result = fn.apply(thisShape !== null ? thisShape.parse(this) : this, argsShape.parse(args));

      return returnShape !== null ? returnShape.parse(result) : result;
    };
  }

  /**
   * Creates a decorator function that parses arguments and passes them to `fn`, and after `fn` asynchronously returns
   * the result, the decorator parses it as well and returns.
   *
   * Use this method if {@link isDecoratorAsync some shapes that describe the function signature} are
   * {@link Shape.isAsync async}.
   *
   * @param fn The underlying function that would receive a parsed arguments.
   * @returns The decorator function.
   */
  decorateAsync(
    fn: InferFunction<A, R extends AnyShape ? Shape<Promise<R['input']> | R['input']> : null, T>
  ): InferDecorator<A, Shape<Promise<R extends AnyShape ? R['output'] : any>>, T> {
    const { argsShape, returnShape, thisShape } = this;

    return function (...args) {
      let promise;

      if (thisShape !== null) {
        promise = thisShape
          .parseAsync(this)
          .then(outputThis => argsShape.parseAsync(args).then(outputArgs => fn.apply(outputThis, outputArgs)));
      } else {
        promise = argsShape.parseAsync(args).then(outputArgs => fn.apply(this, outputArgs));
      }
      if (returnShape !== null) {
        promise = promise.then(returnShape.parseAsync);
      }
      return promise;
    };
  }

  protected _getInputTypes(): readonly ValueType[] {
    return [TYPE_FUNCTION];
  }

  protected _apply(input: any, options: ParseOptions): ApplyResult<InferDecorator<A, R, T>> {
    const { _applyChecks } = this;

    let issues = null;

    if (typeof input !== 'function') {
      return this._typeIssueFactory(input, options);
    }
    if (_applyChecks === null || (issues = _applyChecks(input, null, options)) === null) {
      return this._bare ? ok(this._decorate(input)) : null;
    }
    return issues;
  }

  // noinspection InfiniteRecursionJS
  private _decorate(fn: InferFunction<A, R, T>): InferDecorator<A, R, T> {
    this._decorate = this.isDecoratorAsync ? this.decorateAsync : this.decorate;
    return this._decorate(fn);
  }
}
