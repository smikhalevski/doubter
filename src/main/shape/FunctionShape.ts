import { CODE_TYPE_FUNCTION, ERROR_ASYNC_FUNCTION, MESSAGE_TYPE_FUNCTION } from '../constants.js';
import { isArray } from '../internal/lang.js';
import {
  applyShape,
  Awaitable,
  copyOperations,
  nextNonce,
  ok,
  Promisify,
  unshiftIssuesPath,
} from '../internal/shapes.js';
import { Type } from '../Type.js';
import { IssueOptions, Message, ParseOptions, Result } from '../types.js';
import { createIssue } from '../utils.js';
import { ValidationError } from '../ValidationError.js';
import { AnyShape, INPUT, Input, OUTPUT, Output, Shape } from './Shape.js';

const functionInputs = Object.freeze<unknown[]>([Type.FUNCTION]);

const KEY_THIS = 'this';
const KEY_ARGS = 'arguments';
const KEY_RETURN = 'return';

// prettier-ignore
type InferOrDefault<
  Shape extends AnyShape | null,
  Leg extends INPUT | OUTPUT,
  DefaultValue = any,
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
  ThisShape extends AnyShape | null,
> extends Shape<
  (this: InferOrDefault<ThisShape, OUTPUT>, ...args: Output<ArgsShape>) => InferOrDefault<ReturnShape, INPUT>,
  (this: InferOrDefault<ThisShape, INPUT>, ...args: Input<ArgsShape>) => InferOrDefault<ReturnShape, OUTPUT>
> {
  /**
   * `true` if input functions are wrapped during parsing to ensure runtime signature type-safety, or `false` otherwise.
   */
  isStrict = false;

  /**
   * The type issue options or the type issue message.
   */
  protected _options;

  /**
   * Parsing options that are used by a wrapper.
   */
  protected _parseOptions: ParseOptions | undefined;

  /**
   * Creates a new {@link FunctionShape} instance.
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

    this._options = options;
  }

  /**
   * `true` if some shapes that describe the function signature are {@link Shape.isAsync async}, or `false` otherwise.
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
   * function receives arguments and `this` values that conform the {@link argsShape} and {@link thisShape} respectively,
   * and returns the value that conforms {@link returnShape}.
   *
   * @param options Options that are used by the wrapper. If omitted then default options are applied: no early-return,
   * no type coercion.
   * @returns The new function shape.
   */
  strict(options?: ParseOptions): this {
    const shape = this._clone();
    shape.isStrict = true;
    shape._parseOptions = options;
    return shape;
  }

  /**
   * Creates a function that ensures that `fn` receives arguments and `this` value that conform the {@link argsShape}
   * and the {@link thisShape} respectively, and _synchronously_ returns the value that conforms the {@link returnShape}.
   *
   * @param fn The underlying function.
   * @param options Parsing options. By default, options provided to the {@link strict} method are used.
   * @returns The wrapper function.
   * @template F The function to which signature must be ensured.
   */
  ensure<
    F extends (
      this: InferOrDefault<ThisShape, OUTPUT>,
      ...args: Output<ArgsShape>
    ) => InferOrDefault<ReturnShape, INPUT>,
  >(
    fn: F,
    options?: ParseOptions
  ): (
    this: InferOrDefault<ThisShape, INPUT, ThisType<F>>,
    ...args: Input<ArgsShape>
  ) => InferOrDefault<ReturnShape, OUTPUT, ReturnType<F>>;

  ensure(fn: Function, options?: ParseOptions) {
    if (this.isAsyncFunction) {
      throw new Error(ERROR_ASYNC_FUNCTION);
    }

    const { argsShape, returnShape, thisShape } = this;

    const parseOptionsBase = options || this._parseOptions || { isEarlyReturn: false };

    return function (this: any, ...args: any) {
      const parseOptions = Object.assign({}, parseOptionsBase);

      const fnValue = fn.apply(
        thisShape !== null
          ? getResultValue(KEY_THIS, thisShape['_apply'](this, parseOptions, nextNonce()), this)
          : this,
        getResultValue(KEY_ARGS, argsShape['_apply'](args, parseOptions, nextNonce()), args)
      );

      if (returnShape !== null) {
        return getResultValue(KEY_RETURN, returnShape['_apply'](fnValue, parseOptions, nextNonce()), fnValue);
      }

      return fnValue;
    };
  }

  /**
   * Creates a function that ensures that `fn` receives arguments and `this` value that conform the {@link argsShape}
   * and the {@link thisShape} respectively, and _asynchronously_ returns the value that conforms the {@link returnShape}.
   *
   * Use this method if {@link isAsyncFunction some shapes that describe the function signature} are
   * {@link Shape.isAsync async}.
   *
   * @param fn The underlying function.
   * @param options Parsing options. By default, options provided to the {@link strict} method are used.
   * @returns The wrapper function.
   * @template F The function to which signature must be ensured.
   */
  ensureAsync<
    F extends (
      this: InferOrDefault<ThisShape, OUTPUT>,
      ...args: Output<ArgsShape>
    ) => Awaitable<InferOrDefault<ReturnShape, INPUT>>,
  >(
    fn: F,
    options?: ParseOptions
  ): (
    this: InferOrDefault<ThisShape, INPUT, ThisType<F>>,
    ...args: Input<ArgsShape>
  ) => Promisify<InferOrDefault<ReturnShape, OUTPUT, ReturnType<F>>>;

  ensureAsync(fn: Function, options?: ParseOptions) {
    const { argsShape, returnShape, thisShape } = this;

    const parseOptionsBase = options || this._parseOptions || { isEarlyReturn: false };

    return function (this: any, ...args: any) {
      return new Promise(resolve => {
        const parseOptions = Object.assign({}, parseOptionsBase);

        let fnValue: unknown;

        if (thisShape !== null) {
          fnValue = applyShape(thisShape, this, parseOptions, nextNonce(), thisResult => {
            const thisValue = getResultValue(KEY_THIS, thisResult, this);

            return applyShape(argsShape, args, parseOptions, nextNonce(), argsResult =>
              fn.apply(thisValue, getResultValue(KEY_ARGS, argsResult, args))
            );
          });
        } else {
          fnValue = applyShape(argsShape, args, parseOptions, nextNonce(), argsResult =>
            fn.apply(this, getResultValue(KEY_ARGS, argsResult, args))
          );
        }

        if (returnShape !== null) {
          resolve(
            applyShape(returnShape, fnValue, parseOptions, nextNonce(), resultResult =>
              getResultValue(KEY_RETURN, resultResult, fnValue)
            )
          );
        } else {
          resolve(fnValue);
        }
      });
    };
  }

  protected _getInputs(): readonly unknown[] {
    return functionInputs;
  }

  protected _apply(
    input: any,
    options: ParseOptions,
    _nonce: number
  ): Result<
    (this: InferOrDefault<ThisShape, INPUT>, ...args: Input<ArgsShape>) => InferOrDefault<ReturnShape, OUTPUT>
  > {
    if (typeof input !== 'function') {
      return [createIssue(CODE_TYPE_FUNCTION, input, MESSAGE_TYPE_FUNCTION, undefined, options, this._options)];
    }

    const result = this._applyOperations(input, input, options, null) as Result;

    if (isArray(result) || !this.isStrict) {
      return result;
    }

    const output = result === null ? input : result.value;

    return ok<any>(this.isAsyncFunction ? this.ensureAsync(output) : this.ensure(output));
  }

  protected _applyAsync(
    input: any,
    options: ParseOptions,
    _nonce: number
  ): Promise<
    Result<(this: InferOrDefault<ThisShape, INPUT>, ...args: Input<ArgsShape>) => InferOrDefault<ReturnShape, OUTPUT>>
  > {
    return new Promise(resolve => {
      if (typeof input !== 'function') {
        resolve([createIssue(CODE_TYPE_FUNCTION, input, MESSAGE_TYPE_FUNCTION, undefined, options, this._options)]);
        return;
      }

      resolve(
        Promise.resolve(this._applyOperations(input, input, options, null)).then(result => {
          if (isArray(result) || !this.isStrict) {
            return result;
          }

          const output = result === null ? input : result.value;

          return ok<any>(this.isAsyncFunction ? this.ensureAsync(output) : this.ensure(output));
        })
      );
    });
  }
}

function getResultValue(key: string, result: Result, input: unknown): unknown {
  if (result === null) {
    return input;
  }
  if (isArray(result)) {
    unshiftIssuesPath(result, key);
    throw new ValidationError(result);
  }
  return result.value;
}
