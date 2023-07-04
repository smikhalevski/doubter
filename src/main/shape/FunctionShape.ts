import { CODE_TYPE, ERROR_ASYNC_FUNCTION, MESSAGE_FUNCTION_TYPE } from '../constants';
import {
  applyShape,
  Awaitable,
  copyOperations,
  defaultApplyOptions,
  getErrorMessage,
  INPUT,
  isArray,
  nextNonce,
  ok,
  OUTPUT,
  Promisify,
  unshiftIssuesPath,
} from '../internal';
import { TYPE_FUNCTION } from '../Type';
import { ApplyOptions, IssueOptions, Message, ParseOptions, Result } from '../types';
import { createIssueFactory } from '../utils';
import { ValidationError } from '../ValidationError';
import { AnyShape, Input, Output, Shape } from './Shape';

type ShapeValue<
  Shape extends AnyShape | null | undefined,
  Leg extends INPUT | OUTPUT,
  DefaultValue = any
> = Shape extends null | undefined ? DefaultValue : Shape extends AnyShape ? Shape[Leg] : DefaultValue;

type ThisType<F> = F extends (this: infer T, ...args: any[]) => any ? T : any;

/**
 * The shape of a function.
 *
 * @template ArgsShape The shape of the array of arguments.
 * @template ReturnShape The return value shape, or `null` if unconstrained.
 * @template ThisShape The shape of `this` argument, or `null` if unconstrained.
 * @group Shapes
 */
export class FunctionShape<
  ArgsShape extends Shape<readonly any[], readonly any[]>,
  ReturnShape extends AnyShape | null,
  ThisShape extends AnyShape | null
> extends Shape<
  (this: ShapeValue<ThisShape, OUTPUT>, ...args: Output<ArgsShape>) => ShapeValue<ReturnShape, INPUT>,
  (this: ShapeValue<ThisShape, INPUT>, ...args: Input<ArgsShape>) => ShapeValue<ReturnShape, OUTPUT>
> {
  /**
   * `true` if input functions are wrapped during parsing to ensure runtime signature type-safety, or `false` otherwise.
   */
  isStrict = false;

  /**
   * Returns issues associated with an invalid input value type.
   */
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
   * @param options The issue options or the issue message.
   * @template ArgsShape The shape of the array of arguments.
   * @template ReturnShape The return value shape, or `null` if unconstrained.
   * @template ThisShape The shape of `this` argument, or `null` if unconstrained.
   */
  constructor(
    /**
     * The shape of the array of arguments.
     */
    readonly argsShape: ArgsShape,
    /**
     * The return value shape, or `null` if unconstrained.
     */
    readonly returnShape: ReturnShape,
    /**
     * The shape of `this` value, or `null` if unconstrained.
     */
    readonly thisShape: ThisShape,
    options?: IssueOptions | Message
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
  return<S extends AnyShape | null>(shape: S): FunctionShape<ArgsShape, S, ThisShape> {
    return copyOperations(this, new FunctionShape(this.argsShape, shape, this.thisShape));
  }

  /**
   * Constrains the type of `this` inside the function.
   *
   * @param shape The shape of `this` argument, or `null` if unconstrained.
   * @returns The new function shape.
   * @template S The shape of `this` argument.
   */
  this<S extends AnyShape | null>(shape: S): FunctionShape<ArgsShape, ReturnShape, S> {
    return copyOperations(this, new FunctionShape(this.argsShape, this.returnShape, shape));
  }

  /**
   * Enables input function wrapping during parsing to ensure runtime signature type-safety. Wrapper ensures that input
   * function receives arguments and `this` values that conform {@linkcode argsShape} and {@linkcode thisShape}
   * respectively, and returns the value that conforms {@linkcode returnShape}.
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
   * _synchronously_ returns the value that conforms {@linkcode returnShape}.
   *
   * @param fn The underlying function.
   * @param options Parsing options used by the wrapper. By default, options provided to {@linkcode strict} are used.
   * @returns The wrapper function.
   * @template F The function to wrap.
   */
  ensureSignature<
    F extends (this: ShapeValue<ThisShape, OUTPUT>, ...args: Output<ArgsShape>) => ShapeValue<ReturnShape, INPUT>
  >(
    fn: F,
    options?: Readonly<ParseOptions>
  ): (
    this: ShapeValue<ThisShape, INPUT, ThisType<F>>,
    ...args: Input<ArgsShape>
  ) => ShapeValue<ReturnShape, OUTPUT, ReturnType<F>>;

  ensureSignature(fn: Function, options = this._parseOptions || defaultApplyOptions) {
    const { argsShape, returnShape, thisShape } = this;

    if (this.isAsyncSignature) {
      throw new Error(ERROR_ASYNC_FUNCTION);
    }

    return function (this: any, ...args: any) {
      const result = fn.apply(
        thisShape !== null ? getOrDie('this', thisShape['_apply'](this, options, nextNonce()), this, options) : this,
        getOrDie('arguments', argsShape['_apply'](args, options, nextNonce()), args, options)
      );

      if (returnShape !== null) {
        return getOrDie('return', returnShape['_apply'](result, options, nextNonce()), result, options);
      }

      return result;
    };
  }

  /**
   * Wraps a function to ensure runtime signature type-safety. The returned wrapper function ensures that `fn` receives
   * arguments and `this` values that conform {@linkcode argsShape} and {@linkcode thisShape} respectively, and
   * _asynchronously_ returns the value that conforms {@linkcode returnShape}.
   *
   * Use this method if {@link isAsyncSignature some shapes that describe the function signature} are
   * {@link Shape.isAsync async}.
   *
   * @param fn The underlying function.
   * @param options Parsing options used by the wrapper. By default, options provided to {@linkcode strict} are used.
   * @returns The wrapper function.
   * @template F The function to wrap.
   */
  ensureAsyncSignature<
    F extends (
      this: ShapeValue<ThisShape, OUTPUT>,
      ...args: Output<ArgsShape>
    ) => Awaitable<ShapeValue<ReturnShape, INPUT>>
  >(
    fn: F,
    options?: Readonly<ParseOptions>
  ): (
    this: ShapeValue<ThisShape, INPUT, ThisType<F>>,
    ...args: Input<ArgsShape>
  ) => Promisify<ShapeValue<ReturnShape, OUTPUT, ReturnType<F>>>;

  ensureAsyncSignature(fn: Function, options = this._parseOptions || defaultApplyOptions) {
    const { argsShape, returnShape, thisShape } = this;

    return function (this: any, ...args: any) {
      return new Promise(resolve => {
        let result;

        if (thisShape !== null) {
          result = applyShape(thisShape, this, options, nextNonce(), thisResult => {
            const thisValue = getOrDie('this', thisResult, this, options);

            return applyShape(argsShape, args, options, nextNonce(), argsResult =>
              fn.apply(thisValue, getOrDie('arguments', argsResult, args, options))
            );
          });
        } else {
          result = applyShape(argsShape, args, options, nextNonce(), argsResult =>
            fn.apply(this, getOrDie('arguments', argsResult, args, options))
          );
        }

        if (returnShape !== null) {
          result = Promise.resolve(result).then(result =>
            applyShape(returnShape, result, options, nextNonce(), resultResult =>
              getOrDie('return', resultResult, result, options)
            )
          );
        }

        resolve(result);
      });
    };
  }

  protected _getInputs(): unknown[] {
    return [TYPE_FUNCTION];
  }

  protected _apply(
    input: any,
    options: ApplyOptions,
    nonce: number
  ): Result<(this: ShapeValue<ThisShape, INPUT>, ...args: Input<ArgsShape>) => ShapeValue<ReturnShape, OUTPUT>> {
    if (typeof input !== 'function') {
      return [this._typeIssueFactory(input, options)];
    }

    const result = this._applyOperations(input, input, options, null);

    if (isArray(result) || !this.isStrict) {
      return result;
    }

    const output = result === null ? input : result.value;
    return ok<any>(this.isAsyncSignature ? this.ensureAsyncSignature(output) : this.ensureSignature(output));
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
