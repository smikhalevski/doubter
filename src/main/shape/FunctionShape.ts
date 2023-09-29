import { CODE_TYPE, ERR_ASYNC_FUNCTION } from '../constants';
import { isArray } from '../internal/lang';
import {
  applyShape,
  Awaitable,
  copyOperations,
  defaultApplyOptions,
  getMessage,
  INPUT,
  nextNonce,
  ok,
  OUTPUT,
  Promisify,
  unshiftIssuesPath,
} from '../internal/shapes';
import { TYPE_FUNCTION } from '../Type';
import { ApplyOptions, IssueOptions, Message, ParseOptions, Result } from '../types';
import { createIssueFactory } from '../utils';
import { ValidationError } from '../ValidationError';
import { AnyShape, Input, Output, Shape } from './Shape';

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
   * Returns issues associated with an invalid input value type.
   */
  protected _typeIssueFactory;

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

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, Shape.messages['type.function'], options, TYPE_FUNCTION);
  }

  /**
   * `true` if some shapes that describe the function signature are {@link Shape#isAsync async}, or `false` otherwise.
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
   * function receives arguments and `this` values that conform {@link FunctionShape.argsShape} and
   * {@link FunctionShape.thisShape} respectively, and returns the value that conforms
   * {@link FunctionShape.returnShape}.
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
   * Creates a function that ensures that `fn` receives arguments and `this` value that conform the
   * {@linkcode FunctionShape.argsShape} and the {@linkcode FunctionShape.thisShape} respectively, and _synchronously_
   * returns the value that conforms the {@linkcode FunctionShape.returnShape}.
   *
   * @param fn The underlying function.
   * @param options Parsing options. By default, options provided to {@linkcode FunctionShape.strict} are used.
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

  ensure(fn: Function, options: ParseOptions) {
    if (this.isAsyncFunction) {
      throw new Error(ERR_ASYNC_FUNCTION);
    }

    const { argsShape, returnShape, thisShape } = this;

    options ||= this._parseOptions || defaultApplyOptions;

    return function (this: any, ...args: any) {
      const fnValue = fn.apply(
        thisShape !== null ? getValue(KEY_THIS, thisShape['_apply'](this, options, nextNonce()), this, options) : this,
        getValue(KEY_ARGS, argsShape['_apply'](args, options, nextNonce()), args, options)
      );

      if (returnShape !== null) {
        return getValue(KEY_RETURN, returnShape['_apply'](fnValue, options, nextNonce()), fnValue, options);
      }

      return fnValue;
    };
  }

  /**
   * Creates a function that ensures that `fn` receives arguments and `this` value that conform the
   * {@linkcode FunctionShape.argsShape} and the {@linkcode FunctionShape.thisShape} respectively, and _asynchronously_
   * returns the value that conforms the {@linkcode FunctionShape.returnShape}.
   *
   * Use this method if {@link FunctionShape#isAsyncFunction some shapes that describe the function signature} are
   * {@link Shape#isAsync async}.
   *
   * @param fn The underlying function.
   * @param options Parsing options. By default, options provided to {@linkcode FunctionShape.strict} are used.
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

  ensureAsync(fn: Function, options: ParseOptions) {
    const { argsShape, returnShape, thisShape } = this;

    options ||= this._parseOptions || defaultApplyOptions;

    return function (this: any, ...args: any) {
      return new Promise(resolve => {
        let fnValue: unknown;

        if (thisShape !== null) {
          fnValue = applyShape(thisShape, this, options, nextNonce(), thisResult => {
            const thisValue = getValue(KEY_THIS, thisResult, this, options);

            return applyShape(argsShape, args, options, nextNonce(), argsResult =>
              fn.apply(thisValue, getValue(KEY_ARGS, argsResult, args, options))
            );
          });
        } else {
          fnValue = applyShape(argsShape, args, options, nextNonce(), argsResult =>
            fn.apply(this, getValue(KEY_ARGS, argsResult, args, options))
          );
        }

        if (returnShape !== null) {
          resolve(
            applyShape(returnShape, fnValue, options, nextNonce(), resultResult =>
              getValue(KEY_RETURN, resultResult, fnValue, options)
            )
          );
        } else {
          resolve(fnValue);
        }
      });
    };
  }

  protected _getInputs(): readonly unknown[] {
    return [TYPE_FUNCTION];
  }

  protected _apply(
    input: any,
    options: ApplyOptions,
    nonce: number
  ): Result<
    (this: InferOrDefault<ThisShape, INPUT>, ...args: Input<ArgsShape>) => InferOrDefault<ReturnShape, OUTPUT>
  > {
    if (typeof input !== 'function') {
      return [this._typeIssueFactory(input, options)];
    }

    const result = this._applyOperations(input, input, options, null);

    if (isArray(result) || !this.isStrict) {
      return result;
    }

    const output = result === null ? input : result.value;

    return ok<any>(this.isAsyncFunction ? this.ensureAsync(output) : this.ensure(output));
  }
}

function getValue(key: string, result: Result, input: unknown, options: ParseOptions): unknown {
  if (result === null) {
    return input;
  }
  if (isArray(result)) {
    unshiftIssuesPath(result, key);
    throw new ValidationError(result, getMessage(result, input, options));
  }
  return result.value;
}
