import {
  CODE_DENIED,
  CODE_EXCLUDED,
  CODE_PREDICATE,
  ERROR_REQUIRES_ASYNC,
  MESSAGE_DENIED,
  MESSAGE_EXCLUDED,
  MESSAGE_PREDICATE,
} from '../constants';
import {
  applyShape,
  captureIssues,
  concatIssues,
  defaultApplyOptions,
  Dict,
  getErrorMessage,
  INPUT,
  isArray,
  isEqual,
  isObjectLike,
  isType,
  nextNonce,
  ok,
  OUTPUT,
  Promisify,
  pushIssue,
  ReadonlyDict,
  returnTrue,
  toDeepPartialShape,
  unionTypes,
  universalApplyOperations,
} from '../internal';
import { getTypeOf, TYPE_UNKNOWN } from '../Type';
import {
  AlterCallback,
  ApplyOptions,
  CheckCallback,
  Err,
  Issue,
  IssueOptions,
  Literal,
  Message,
  Ok,
  Operation,
  OperationCallback,
  OperationCallbackFactory,
  OperationOptions,
  ParameterizedOperationOptions,
  ParameterizedRefineOptions,
  ParseOptions,
  RefineCallback,
  RefineOptions,
  RefinePredicate,
  Result,
} from '../types';
import { createIssueFactory, extractOptions } from '../utils';
import { ValidationError } from '../ValidationError';

/**
 * The marker object that is used to denote an impossible value.
 *
 * For example, `NEVER` is returned from {@linkcode CoercibleShape#_coerce CoercibleShape._coerce} method when coercion
 * is not possible.
 *
 * @group Other
 */
export const NEVER = Object.freeze({ never: true }) as never;

/**
 * Extracts the shape input type.
 *
 * @template S The shape from which the input type must be inferred.
 * @group Type Inference
 */
export type Input<S extends AnyShape> = S[INPUT];

/**
 * Extracts the shape output type.
 *
 * @template S The shape from which the output type must be inferred.
 * @group Type Inference
 */
export type Output<S extends AnyShape> = S[OUTPUT];

/**
 * Excludes `U` from `T` only if `U` is a literal type.
 */
// prettier-ignore
type ExcludeLiteral<T, U> =
  number extends U ? T :
  string extends U ? T :
  symbol extends U ? T :
  bigint extends U ? T :
  object extends U ? T :
  boolean extends U ? T :
  Exclude<T, U>;

/**
 * The ephemeral unique symbol that is used for type branding by {@linkcode Branded}.
 */
declare const BRAND: unique symbol;

/**
 * The branded type.
 *
 * @template Value The value to brand.
 * @template Brand The brand value.
 * @group Other
 */
export type Branded<Value, Brand> = Value & { [BRAND]: Brand };

/**
 * A shape should implement {@linkcode DeepPartialProtocol} to support conversion to a deep partial alternative.
 *
 * @template S The deep partial alternative of the shape.
 * @group Other
 */
export interface DeepPartialProtocol<S extends AnyShape> {
  /**
   * Converts the shape and its child shapes to deep partial alternatives.
   *
   * **Note** This method returns a shape without any operations.
   *
   * @returns The deep partial clone of the shape.
   */
  deepPartial(): S;
}

/**
 * An arbitrary shape.
 *
 * @group Shapes
 */
export type AnyShape = Shape | Shape<never>;

/**
 * Returns the shape that refines the shape output.
 *
 * @template S The base shape.
 * @template RefinedValue The refined output value.
 * @group Shapes
 */
export type RefineShape<S extends AnyShape, RefinedValue> = Shape<Input<S>, RefinedValue> & Omit<S, keyof Shape>;

/**
 * Returns the deep partial alternative of the shape if it implements {@linkcode DeepPartialProtocol}, or returns shape
 * as is if it doesn't.
 *
 * @template S The shape to convert to a deep partial alternative.
 * @group Shapes
 */
export type DeepPartialShape<S extends AnyShape> = S extends DeepPartialProtocol<infer T> ? T : S;

/**
 * Shape that is both optional and deep partial.
 *
 * @template S The shape to convert to an optional deep partial alternative.
 * @group Shapes
 */
export type OptionalDeepPartialShape<S extends AnyShape> = AllowLiteralShape<DeepPartialShape<S>, undefined>;

/**
 * Shortcut for {@linkcode ReplaceLiteralShape} that allows the same value as both an input and an output.
 *
 * @template S The shape that parses the input without the replaced value.
 * @template AllowedValue The value that is allowed as an input and output.
 * @group Shapes
 */
export type AllowLiteralShape<S extends AnyShape, AllowedValue> = ReplaceLiteralShape<S, AllowedValue, AllowedValue>;

/**
 * Shortcut for {@linkcode ExcludeShape} that doesn't impose the exclusion on the type level.
 *
 * @template BaseShape The base shape.
 * @template ExcludedShape The shape to which the output must not conform.
 * @group Shapes
 */
export interface NotShape<BaseShape extends AnyShape, ExcludedShape extends AnyShape>
  extends Shape<Input<BaseShape>, Output<BaseShape>>,
    DeepPartialProtocol<NotShape<DeepPartialShape<BaseShape>, ExcludedShape>> {
  /**
   * The base shape.
   */
  readonly baseShape: BaseShape;

  /**
   * The shape to which the output must not conform.
   */
  readonly excludedShape: ExcludedShape;
}

/**
 * The baseline shape implementation.
 *
 * @template InputValue The input value.
 * @template OutputValue The output value.
 * @group Shapes
 */
export class Shape<InputValue = any, OutputValue = InputValue> {
  /**
   * The shape input type.
   *
   * @internal
   */
  declare readonly [INPUT]: InputValue;

  /**
   * The shape output type.
   *
   * @internal
   */
  declare readonly [OUTPUT]: OutputValue;

  /**
   * The dictionary of shape annotations.
   *
   * @see {@linkcode annotate}
   */
  annotations: Dict = {};

  /**
   * The array of operations that the shape applies after the input value type is ensured.
   *
   * @see {@linkcode use}
   * @see [Operations](https://github.com/smikhalevski/doubter#operations)
   */
  operations: readonly Operation[] = [];

  /**
   * The callback that applies {@linkcode operations operations} to the shape output value.
   */
  protected declare _applyOperations: OperationCallback;

  /**
   * Returns a sub-shape that describes a value associated with the given property name, or `null` if there's no such
   * sub-shape.
   *
   * @param key The key for which the sub-shape must be retrieved.
   * @returns The sub-shape or `null` if there's no such key in the shape.
   */
  at(key: unknown): AnyShape | null {
    return null;
  }

  /**
   * Returns `true` if the shape accepts given input type or value, or `false` otherwise.
   *
   * @param input The type or value that must be checked.
   */
  accepts(input: unknown): boolean {
    const { inputs } = this;

    return inputs.includes(TYPE_UNKNOWN) || inputs.includes(input) || inputs.includes(getTypeOf(input));
  }

  /**
   * Assigns annotations to the shape.
   *
   * @param annotations Annotations to add.
   * @returns The clone of the shape with the updated annotations.
   * @see {@linkcode annotations}
   */
  annotate(annotations: ReadonlyDict): this {
    const shape = this._clone();
    shape.annotations = Object.assign({}, this.annotations, annotations);
    return shape;
  }

  /**
   * Appends an operation to the shape.
   *
   * @param cb The factory that produces the operation callback.
   * @param options The operation operations.
   * @returns The clone of the shape.
   * @see [Operations](https://github.com/smikhalevski/doubter#operations)
   */
  use(cb: OperationCallbackFactory<InputValue, OutputValue>, options?: OperationOptions): this {
    const shape = this._clone();

    shape.operations = this.operations.concat({
      type: options?.type,
      param: options?.param,
      factory: cb,
    });

    return shape;
  }

  /**
   * Adds the check that is applied to the shape output.
   *
   * If the {@linkcode ParameterizedOperationOptions#type type} is `undefined` then the `cb` identity is used as a type.
   *
   * If check callback returns an empty array, it is considered that no issues have occurred.
   *
   * @param cb The callback that checks the shape output.
   * @param options The operation options.
   * @returns The clone of the shape.
   * @template Param The param that is passed to the {@linkcode CheckCallback} when a check operation is applied.
   * @see {@linkcode refine}
   */
  check<Param>(cb: CheckCallback<OutputValue, Param>, options: ParameterizedOperationOptions<Param>): this;

  /**
   * Adds the check that is applied to the shape output.
   *
   * If the {@linkcode OperationOptions#type type} is `undefined` then the `cb` identity is used as a type.
   *
   * If check callback returns an empty array, it is considered that no issues have occurred.
   *
   * @param cb The callback that checks the shape output.
   * @param options The operation options.
   * @returns The clone of the shape.
   * @see {@linkcode refine}
   */
  check(cb: CheckCallback<OutputValue>, options?: OperationOptions): this;

  check(cb: CheckCallback, options: OperationOptions = {}): this {
    const { param } = options;

    return this.use(
      next => (input, output, options, issues) => {
        let result;
        try {
          result = cb(output, param, options);
        } catch (error) {
          issues = concatIssues(issues, captureIssues(error));

          if (!options.verbose) {
            return issues;
          }
        }

        if (!isObjectLike(result)) {
          return next(input, output, options, issues);
        }

        if (!isArray(result)) {
          issues = pushIssue(issues, result);
        } else if (result.length !== 0) {
          issues = concatIssues(issues, result);
        }

        if (issues !== null && !options.verbose) {
          return issues;
        }

        return next(input, output, options, issues);
      },
      options
    );
  }

  /**
   * Refines the shape output type with the
   * [narrowing predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html).
   *
   * If the {@linkcode RefineOptions#type type} is `undefined` then the `cb` identity is used as a type.
   *
   * @param cb The predicate that returns `true` if value conforms the required type, or `false` otherwise.
   * @param options The operation options or the issue message.
   * @returns The shape with the narrowed output.
   * @template RefinedValue The narrowed output value.
   * @template Param The param that is passed to the {@linkcode RefinePredicate} when a refinement operation is applied.
   * @see {@linkcode check}
   */
  refine<RefinedValue extends OutputValue, Param>(
    cb: RefinePredicate<OutputValue, RefinedValue, Param>,
    options: ParameterizedRefineOptions<Param> | Message
  ): RefineShape<this, RefinedValue>;

  /**
   * Refines the shape output type with the
   * [narrowing predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html).
   *
   * If the {@linkcode RefineOptions#type type} is `undefined` then the `cb` identity is used as a type.
   *
   * @param cb The predicate that returns `true` if value conforms the required type, or `false` otherwise.
   * @param options The operation options or the issue message.
   * @returns The shape with the narrowed output.
   * @template RefinedValue The narrowed output value.
   * @see {@linkcode check}
   */
  refine<RefinedValue extends OutputValue>(
    cb: RefinePredicate<OutputValue, RefinedValue>,
    options?: RefineOptions | Message
  ): RefineShape<this, RefinedValue>;

  /**
   * Checks that the output value conforms the predicate.
   *
   * If the {@linkcode RefineOptions#type type} is `undefined` then the `cb` identity is used as a type.
   *
   * @param cb The predicate that returns truthy result if value is valid, or returns falsy result otherwise.
   * @param options The operation options or the issue message.
   * @returns The clone of the shape.
   * @template Param The param that is passed to the {@linkcode RefineCallback} when a refinement operation is applied.
   * @see {@linkcode check}
   */
  refine<Param>(cb: RefineCallback<OutputValue, Param>, options?: ParameterizedRefineOptions<Param> | Message): this;

  /**
   * Checks that the output value conforms the predicate.
   *
   * If the {@linkcode RefineOptions#type type} is `undefined` then the `cb` identity is used as a type.
   *
   * @param cb The predicate that returns truthy result if value is valid, or returns falsy result otherwise.
   * @param options The operation options or the issue message.
   * @returns The clone of the shape.
   * @see {@linkcode check}
   */
  refine(cb: RefineCallback<OutputValue>, options?: RefineOptions | Message): this;

  refine(cb: RefineCallback, options?: RefineOptions | Message): Shape {
    const { type, code = CODE_PREDICATE, param } = extractOptions(options);

    const issueFactory = createIssueFactory(code, MESSAGE_PREDICATE, options, cb);

    return this.use(
      next => (input, output, options, issues) => {
        let result;
        try {
          result = cb(output, param, options);
        } catch (error) {
          issues = concatIssues(issues, captureIssues(error));

          if (!options.verbose) {
            return issues;
          }
        }

        if (!result) {
          issues = pushIssue(issues, issueFactory(output, options));

          if (!options.verbose) {
            return issues;
          }
        }

        return next(input, output, options, issues);
      },
      { type, param }
    );
  }

  /**
   * Alters the shape output value without changing its type.
   *
   * @param cb The callback that alters the shape output.
   * @param options The operation options.
   * @returns The clone of the shape.
   * @template Param The param that is passed to the {@linkcode AlterCallback} when an alteration operation is applied.
   * @see {@linkcode convert}
   */
  alter<Param>(cb: AlterCallback<OutputValue, Param>, options: ParameterizedOperationOptions<Param>): this;

  /**
   * Alters the shape output value without changing its type.
   *
   * @param cb The callback that alters the shape output.
   * @param options The operation options.
   * @returns The clone of the shape.
   * @see {@linkcode convert}
   */
  alter(cb: AlterCallback<OutputValue>, options?: OperationOptions): this;

  alter(cb: AlterCallback, options: OperationOptions = {}): Shape {
    const { param } = options;

    return this.use(
      next => (input, output, options, issues) => {
        try {
          output = cb(output, param, options);
        } catch (error) {
          issues = concatIssues(issues, captureIssues(error));

          if (!options.verbose) {
            return issues;
          }
        }

        return next(input, output, options, issues);
      },
      options
    );
  }

  /**
   * Synchronously converts the output value of the shape.
   *
   * @param cb The callback that converts the shape output value.
   * @returns The {@linkcode ConvertShape} instance.
   * @template ConvertedValue The value returned from the callback that converts the output value of this shape.
   * @see {@linkcode alter}
   */
  convert<ConvertedValue>(
    /**
     * Throw a {@linkcode ValidationError} to notify that the conversion cannot be successfully completed.
     *
     * @param value The shape output value.
     * @param options Parsing options.
     * @return The converted value.
     */
    cb: (value: OutputValue, options: ApplyOptions) => ConvertedValue
  ): Shape<InputValue, ConvertedValue> {
    return this.to(new ConvertShape(cb));
  }

  /**
   * Asynchronously converts the output value of the shape.
   *
   * @param cb The callback that converts the shape output value.
   * @returns The {@linkcode ConvertShape} instance.
   * @template ConvertedValue The value returned from the callback that converts the output value of this shape.
   * @see {@linkcode alter}
   */
  convertAsync<ConvertedValue>(
    /**
     * Reject with a {@linkcode ValidationError} to notify that the conversion cannot be successfully completed.
     *
     * @param value The shape output value.
     * @param options Parsing options.
     * @return The converted value.
     */
    cb: (value: OutputValue, options: ApplyOptions) => PromiseLike<ConvertedValue>
  ): Shape<InputValue, ConvertedValue> {
    return this.to(new ConvertShape(cb, true));
  }

  /**
   * Pipes the output of this shape to the input of another shape.
   *
   * @param shape The shape that validates the output if this shape.
   * @template OutputShape The output value.
   */
  to<OutputShape extends AnyShape>(shape: OutputShape): PipeShape<this, OutputShape> {
    return new PipeShape(this, shape);
  }

  /**
   * Returns a shape that adds a brand to the output type.
   *
   * @returns A shape with the branded output type.
   * @template Brand The brand value.
   */
  brand<Brand extends string | number | symbol>(): RefineShape<this, Branded<OutputValue, Brand>> {
    return this as any;
  }

  /**
   * Replaces an input value with an output value.
   *
   * @param inputValue The input value to replace.
   * @param outputValue The output value that is returned if an `inputValue` is received.
   * @template InputValue The input value to replace.
   * @template OutputValue The output value that is used as the replacement for an input value.
   */
  replace<InputValue extends Literal, OutputValue extends Literal>(
    inputValue: InputValue,
    outputValue: OutputValue
  ): ReplaceLiteralShape<this, InputValue, OutputValue> {
    return new ReplaceLiteralShape(this, inputValue, outputValue);
  }

  /**
   * Allows a literal input value, so it is passed directly to the output without any checks.
   *
   * @param value The allowed value.
   * @template AllowedValue The allowed value.
   */
  allow<AllowedValue extends Literal>(value: AllowedValue): AllowLiteralShape<this, AllowedValue> {
    return this.replace(value, value);
  }

  /**
   * Excludes value from both input and output.
   *
   * @param value The excluded value.
   * @param options The issue options or the issue message.
   * @template DeniedValue The denied value.
   */
  deny<DeniedValue extends InputValue | OutputValue>(
    value: DeniedValue,
    options?: IssueOptions | Message
  ): DenyLiteralShape<this, DeniedValue> {
    return new DenyLiteralShape(this, value, options);
  }

  /**
   * Replaces `undefined` input value with an `undefined` output value.
   */
  optional(): AllowLiteralShape<this, undefined>;

  /**
   * Replaces `undefined` input value with a default output value.
   *
   * @param defaultValue The value that should be used if an input value is `undefined`.
   * @template DefaultValue The value that is used as the replacement for `undefined`.
   */
  optional<DefaultValue extends Literal>(
    defaultValue: DefaultValue
  ): ReplaceLiteralShape<this, undefined, DefaultValue>;

  optional(defaultValue?: any) {
    return this.replace(undefined, defaultValue);
  }

  /**
   * Replaces `null` input value with an `null` output value.
   */
  nullable(): AllowLiteralShape<this, null>;

  /**
   * Replaces `null` input value with a default output value.
   *
   * @param defaultValue The value that should be used if an input value is `null`.
   * @template DefaultValue The value that is used as the replacement for `null`.
   */
  nullable<DefaultValue extends Literal>(defaultValue: DefaultValue): ReplaceLiteralShape<this, null, DefaultValue>;

  nullable(defaultValue?: any) {
    return this.replace(null, arguments.length === 0 ? null : defaultValue);
  }

  /**
   * Passes `null` and `undefined` input values directly to the output without parsing.
   */
  nullish(): AllowLiteralShape<AllowLiteralShape<this, null>, undefined>;

  /**
   * Replaces `null` and `undefined` input value with a default output value.
   *
   * @param defaultValue The value that should be used if an input value is `undefined` or `null`.
   * @template DefaultValue The value that is used as the replacement for `undefined` and `null`.
   */
  nullish<DefaultValue extends Literal>(
    defaultValue?: DefaultValue
  ): ReplaceLiteralShape<ReplaceLiteralShape<this, null, DefaultValue>, undefined, DefaultValue>;

  nullish(defaultValue?: any) {
    return this.nullable(arguments.length === 0 ? null : defaultValue).replace(undefined, defaultValue);
  }

  /**
   * Prevents an input and output from being `undefined`.
   *
   * @param options The issue options or the issue message.
   */
  nonOptional(options?: IssueOptions | Message): DenyLiteralShape<this, undefined> {
    return new DenyLiteralShape(this, undefined, options);
  }

  /**
   * Returns `undefined` if parsing fails.
   */
  catch(): CatchShape<this, undefined>;

  /**
   * Returns the fallback value if parsing fails.
   *
   * @param fallback The value or a callback that returns a value that is returned if parsing has failed. A callback
   * receives an input value, an array of raised issues, and {@link ApplyOptions parsing options}.
   * @template FallbackValue The fallback value.
   */
  catch<FallbackValue extends Literal>(
    fallback: FallbackValue | ((input: any, issues: Issue[], options: ApplyOptions) => FallbackValue)
  ): CatchShape<this, FallbackValue>;

  catch(fallback?: unknown): Shape {
    return new CatchShape(this, fallback);
  }

  /**
   * Checks that the input doesn't match the shape.
   *
   * @param shape The shape to which the output must not conform.
   * @param options The issue options or the issue message.
   * @template ExcludedShape The shape to which the output must not conform.
   */
  exclude<ExcludedShape extends AnyShape>(
    shape: ExcludedShape,
    options?: IssueOptions | Message
  ): ExcludeShape<this, ExcludedShape> {
    return new ExcludeShape(this, shape, options);
  }

  /**
   * Checks that the input doesn't match the shape.
   *
   * This method works exactly as {@linkcode exclude} at runtime, but it doesn't perform the exclusion on the type
   * level.
   *
   * @param shape The shape to which the output must not conform.
   * @param options The issue options or the issue message.
   * @template ExcludedShape The shape to which the output must not conform.
   */
  not<ExcludedShape extends AnyShape>(
    shape: ExcludedShape,
    options?: IssueOptions | Message
  ): NotShape<this, ExcludedShape> {
    return this.exclude(shape, options);
  }

  /**
   * Must return `true` if the shape must be used in async context only, otherwise the shape can be used in both sync
   * and async contexts. Override this method to implement a custom shape.
   *
   * @see [Advanced shapes](https://github.com/smikhalevski/doubter#advanced-shapes)
   */
  protected _isAsync(): boolean {
    return false;
  }

  /**
   * Returns input types and literal values that this shape can accept as an input.
   *
   * @see [Advanced shapes](https://github.com/smikhalevski/doubter#advanced-shapes)
   */
  protected _getInputs(): unknown[] {
    return [TYPE_UNKNOWN];
  }

  /**
   * Clones the shape.
   *
   * @see [Advanced shapes](https://github.com/smikhalevski/doubter#advanced-shapes)
   */
  protected _clone(): this {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
  }

  /**
   * Synchronously parses the input.
   *
   * **Note** Don't store or update returned instances of {@link Ok} since they can be reused.
   *
   * @param input The shape input to parse.
   * @param options Parsing options.
   * @param nonce The globally unique number that identifies the parsing process.
   * @returns `null` if input matches the output, {@linkcode Ok} that wraps the output, or an array of captured issues.
   * @see [Advanced shapes](https://github.com/smikhalevski/doubter#advanced-shapes)
   */
  protected _apply(input: unknown, options: ApplyOptions, nonce: number): Result<OutputValue> {
    return this._applyOperations(input, input, options, null);
  }

  /**
   * Asynchronously parses the input.
   *
   * **Note** Don't store or update returned instances of {@link Ok} since they can be reused.
   *
   * @param input The shape input to parse.
   * @param options Parsing options.
   * @param nonce The globally unique number that identifies the parsing process.
   * @returns `null` if input matches the output, {@linkcode Ok} that wraps the output, or an array of captured issues.
   * @see [Advanced shapes](https://github.com/smikhalevski/doubter#advanced-shapes)
   */
  protected _applyAsync(input: unknown, options: ApplyOptions, nonce: number): Promise<Result<OutputValue>> {
    return new Promise(resolve => {
      resolve(this._apply(input, options, nonce));
    });
  }
}

export interface Shape<InputValue, OutputValue> {
  /**
   * The array of unique input types and values that are accepted by the shape.
   */
  readonly inputs: readonly unknown[];

  /**
   * `true` if the shape allows only {@linkcode parseAsync} and throws an error if {@linkcode parse} is called, or
   * `false` if the shape can be used in both sync and async contexts.
   */
  readonly isAsync: boolean;

  /**
   * Synchronously parses the value and returns {@linkcode Ok} or {@linkcode Err} object that wraps the result.
   *
   * @param input The value to parse.
   * @param options Parsing options.
   * @returns The {@linkcode Ok} instance if parsing has succeeded or {@linkcode Err} if parsing has failed.
   * @throws `Error` if the shape doesn't support the sync parsing, see {@linkcode isAsync}.
   */
  try(input: unknown, options?: ApplyOptions): Ok<OutputValue> | Err;

  /**
   * Asynchronously parses the value and returns {@linkcode Ok} or {@linkcode Err} object that wraps the result.
   *
   * @param input The value to parse.
   * @param options Parsing options.
   * @returns The {@linkcode Ok} instance if parsing has succeeded or {@linkcode Err} if parsing has failed.
   */
  tryAsync(input: unknown, options?: ApplyOptions): Promise<Ok<OutputValue> | Err>;

  /**
   * Synchronously parses the value.
   *
   * @param input The value to parse.
   * @param options Parsing options.
   * @returns The value that conforms the output type of the shape.
   * @throws `Error` if the shape doesn't support the sync parsing, see {@linkcode isAsync}.
   * @throws {@linkcode ValidationError} if any issues occur during parsing.
   */
  parse(input: unknown, options?: ParseOptions): OutputValue;

  /**
   * Asynchronously parses the value.
   *
   * @param input The value to parse.
   * @param options Parsing options.
   * @returns The value that conforms the output type of the shape.
   * @throws {@linkcode ValidationError} if any issues occur during parsing.
   */
  parseAsync(input: unknown, options?: ParseOptions): Promisify<OutputValue>;

  /**
   * Synchronously parses the value and returns `undefined` if parsing fails.
   *
   * @param input The value to parse.
   * @returns The value that conforms the output type of the shape.
   * @throws `Error` if the shape doesn't support the sync parsing, see {@linkcode isAsync}.
   */
  parseOrDefault(input: unknown): OutputValue | undefined;

  /**
   * Synchronously parses the value and returns the default value if parsing fails.
   *
   * @param input The value to parse.
   * @param defaultValue The default value that is returned if parsing fails.
   * @param options Parsing options.
   * @template DefaultValue The default value that is returned if parsing fails.
   * @returns The value that conforms the output type of the shape.
   * @throws `Error` if the shape doesn't support the sync parsing, see {@linkcode isAsync}.
   */
  parseOrDefault<DefaultValue>(
    input: unknown,
    defaultValue: DefaultValue,
    options?: ApplyOptions
  ): OutputValue | DefaultValue;

  /**
   * Asynchronously parses the value and returns `undefined` value if parsing fails.
   *
   * @param input The value to parse.
   * @returns The value that conforms the output type of the shape.
   */
  parseOrDefaultAsync(input: unknown): Promisify<OutputValue | undefined>;

  /**
   * Asynchronously parses the value and returns the default value if parsing fails.
   *
   * @param input The value to parse.
   * @param defaultValue The default value that is returned if parsing fails.
   * @param options Parsing options.
   * @template DefaultValue The default value that is returned if parsing fails.
   * @returns The value that conforms the output type of the shape.
   */
  parseOrDefaultAsync<DefaultValue>(
    input: unknown,
    defaultValue: DefaultValue,
    options?: ApplyOptions
  ): Promisify<OutputValue | DefaultValue>;
}

Object.defineProperties(Shape.prototype, {
  inputs: {
    configurable: true,
    get(this: Shape) {
      Object.defineProperty(this, 'inputs', { configurable: true, value: [] });

      const inputs = Object.freeze(unionTypes(this._getInputs()));

      Object.defineProperty(this, 'inputs', { configurable: true, value: inputs });

      return inputs;
    },
  },

  isAsync: {
    configurable: true,
    get(this: Shape) {
      Object.defineProperty(this, 'isAsync', { configurable: true, value: false });

      const async = this._isAsync();
      const universalApplyAsync = Shape.prototype._applyAsync;

      if (async) {
        this._apply = () => {
          throw new Error(ERROR_REQUIRES_ASYNC);
        };
      } else if (this._applyAsync !== universalApplyAsync) {
        this._applyAsync = universalApplyAsync;
      }

      Object.defineProperty(this, 'isAsync', { configurable: true, value: async });

      return async;
    },
  },

  try: {
    configurable: true,
    get(this: Shape) {
      this.isAsync;

      const cb: Shape['try'] = (input, options = defaultApplyOptions) => {
        const result = this._apply(input, options, nextNonce());

        if (result === null) {
          return { ok: true, value: input };
        }
        if (isArray(result)) {
          return { ok: false, issues: result };
        }
        return { ok: true, value: result.value };
      };

      Object.defineProperty(this, 'try', { writable: true, value: cb });

      return cb;
    },
  },

  tryAsync: {
    configurable: true,
    get(this: Shape) {
      this.isAsync;

      const cb: Shape['tryAsync'] = (input, options = defaultApplyOptions) => {
        return this._applyAsync(input, options, nextNonce()).then(result => {
          if (result === null) {
            return { ok: true, value: input };
          }
          if (isArray(result)) {
            return { ok: false, issues: result };
          }
          return { ok: true, value: result.value };
        });
      };

      Object.defineProperty(this, 'tryAsync', { writable: true, value: cb });

      return cb;
    },
  },

  parse: {
    configurable: true,
    get(this: Shape) {
      this.isAsync;

      const cb: Shape['parse'] = (input, options = defaultApplyOptions) => {
        const result = this._apply(input, options, nextNonce());

        if (result === null) {
          return input;
        }
        if (isArray(result)) {
          throw new ValidationError(result, getErrorMessage(result, input, options));
        }
        return result.value;
      };

      Object.defineProperty(this, 'parse', { writable: true, value: cb });

      return cb;
    },
  },

  parseAsync: {
    configurable: true,
    get(this: Shape) {
      this.isAsync;

      const cb: Shape['parseAsync'] = (input, options = defaultApplyOptions) => {
        return this._applyAsync(input, options, nextNonce()).then(result => {
          if (result === null) {
            return input;
          }
          if (isArray(result)) {
            throw new ValidationError(result, getErrorMessage(result, input, options));
          }
          return result.value;
        });
      };

      Object.defineProperty(this, 'parseAsync', { writable: true, value: cb });

      return cb;
    },
  },

  parseOrDefault: {
    configurable: true,
    get(this: Shape) {
      this.isAsync;

      const cb: Shape['parseOrDefault'] = (input: unknown, defaultValue?: unknown, options = defaultApplyOptions) => {
        const result = this._apply(input, options, nextNonce());

        if (result === null) {
          return input;
        }
        if (isArray(result)) {
          return defaultValue;
        }
        return result.value;
      };

      Object.defineProperty(this, 'parseOrDefault', { writable: true, value: cb });

      return cb;
    },
  },

  parseOrDefaultAsync: {
    configurable: true,
    get(this: Shape) {
      this.isAsync;

      const cb: Shape['parseOrDefaultAsync'] = (
        input: unknown,
        defaultValue?: unknown,
        options = defaultApplyOptions
      ) => {
        return this._applyAsync(input, options, nextNonce()).then(result => {
          if (result === null) {
            return input;
          }
          if (isArray(result)) {
            return defaultValue;
          }
          return result.value;
        });
      };

      Object.defineProperty(this, 'parseOrDefaultAsync', { writable: true, value: cb });

      return cb;
    },
  },

  _applyOperations: {
    configurable: true,
    get(this: Shape) {
      let cb = universalApplyOperations;

      for (let i = this.operations.length - 1; i >= 0; --i) {
        cb = this.operations[i].factory(cb);
      }

      Object.defineProperty(this, '_applyOperations', { writable: true, value: cb });

      return cb;
    },
  },
});

/**
 * The shape that applies a converter to the input.
 *
 * @template ConvertedValue The output value of the callback that converts the input value.
 * @group Shapes
 */
export class ConvertShape<ConvertedValue> extends Shape<any, ConvertedValue> {
  /**
   * Creates the new {@linkcode ConvertShape} instance.
   *
   * @param converter The callback that converts the input value.
   * @param async If `true` then the convert shape waits for the promise returned from the callback to be fulfilled.
   * Otherwise, the value that is synchronously returned from the callback is used as an output.
   * @template ConvertedValue The output value of the callback that converts the input value.
   */
  constructor(
    /**
     * The callback that converts the input value.
     *
     * @param value The input value.
     * @param options Parsing options.
     * @return The conversion result.
     * @throws {@linkcode ValidationError} to notify that the conversion cannot be successfully completed.
     */
    readonly converter: (value: any, options: ApplyOptions) => PromiseLike<ConvertedValue> | ConvertedValue,
    async?: boolean
  ) {
    super();

    if (async) {
      this._isAsync = returnTrue;
    }
  }

  protected _apply(input: unknown, options: ApplyOptions, nonce: number): Result<ConvertedValue> {
    let output;

    try {
      output = this.converter(input, options) as ConvertedValue;
    } catch (error) {
      return captureIssues(error);
    }
    return this._applyOperations(input, output, options, null);
  }

  protected _applyAsync(input: unknown, options: ApplyOptions, nonce: number): Promise<Result<ConvertedValue>> {
    return new Promise(resolve => {
      resolve(this.converter(input, options));
    }).then(output => this._applyOperations(input, output, options, null), captureIssues);
  }
}

/**
 * The shape that parses the output of the input shape with the output shape.
 *
 * @template InputShape The input shape.
 * @template OutputShape The output shape.
 * @group Shapes
 */
export class PipeShape<InputShape extends AnyShape, OutputShape extends AnyShape>
  extends Shape<Input<InputShape>, Output<OutputShape>>
  implements DeepPartialProtocol<PipeShape<DeepPartialShape<InputShape>, DeepPartialShape<OutputShape>>>
{
  /**
   * Creates the new {@linkcode PipeShape} instance.
   *
   * @param inputShape The shape that parses the input value.
   * @param outputShape The shape that parses the output of `inputShape`.
   * @template InputShape The input shape.
   * @template OutputShape The output shape.
   */
  constructor(
    /**
     * The input shape.
     */
    readonly inputShape: InputShape,
    /**
     * The output shape.
     */
    readonly outputShape: OutputShape
  ) {
    super();
  }

  deepPartial(): PipeShape<DeepPartialShape<InputShape>, DeepPartialShape<OutputShape>> {
    return new PipeShape(toDeepPartialShape(this.inputShape), toDeepPartialShape(this.outputShape));
  }

  protected _isAsync(): boolean {
    return this.inputShape.isAsync || this.outputShape.isAsync;
  }

  protected _getInputs(): unknown[] {
    return this.inputShape.inputs.slice(0);
  }

  protected _apply(input: unknown, options: ApplyOptions, nonce: number): Result<Output<OutputShape>> {
    const { inputShape, outputShape } = this;

    let output = input;

    const inputResult = inputShape['_apply'](input, options, nonce);

    if (inputResult !== null) {
      if (isArray(inputResult)) {
        return inputResult;
      }
      output = inputResult.value;
    }

    const outputResult = outputShape['_apply'](output, options, nonce);

    if (outputResult !== null) {
      if (isArray(outputResult)) {
        return outputResult;
      }
      output = outputResult.value;
    }
    return this._applyOperations(input, output, options, null);
  }

  protected _applyAsync(input: unknown, options: ApplyOptions, nonce: number): Promise<Result<Output<OutputShape>>> {
    return this.inputShape['_applyAsync'](input, options, nonce).then(inputResult => {
      let output = input;

      if (inputResult !== null) {
        if (isArray(inputResult)) {
          return inputResult;
        }
        output = inputResult.value;
      }

      return applyShape(this.outputShape, output, options, nonce, outputResult => {
        if (outputResult !== null) {
          if (isArray(outputResult)) {
            return outputResult;
          }
          output = outputResult.value;
        }
        return this._applyOperations(input, output, options, null);
      });
    });
  }
}

/**
 * The shape that replaces an input literal value with an output literal value.
 *
 * @template BaseShape The shape that parses the input without the replaced value.
 * @template InputValue The input value to replace.
 * @template OutputValue The output value that is used as the replacement for an input value.
 * @group Shapes
 */
export class ReplaceLiteralShape<BaseShape extends AnyShape, InputValue, OutputValue>
  extends Shape<Input<BaseShape> | InputValue, ExcludeLiteral<Output<BaseShape>, InputValue> | OutputValue>
  implements DeepPartialProtocol<ReplaceLiteralShape<DeepPartialShape<BaseShape>, InputValue, OutputValue>>
{
  private _result: Result<OutputValue>;

  /**
   * Creates the new {@linkcode ReplaceLiteralShape} instance.
   *
   * @param baseShape The shape that parses the input without the replaced value.
   * @param inputValue The input value to replace.
   * @param outputValue The output value that is returned if an `inputValue` is received.
   * @template BaseShape The shape that parses the input without the replaced value.
   * @template InputValue The input value to replace.
   * @template OutputValue The output value that is used as the replacement for an input value.
   */
  constructor(
    /**
     * The shape that parses the input without the replaced value.
     */
    readonly baseShape: BaseShape,
    /**
     * The input value to replace.
     */
    readonly inputValue: InputValue,
    /**
     * The output value that is returned if an {@linkcode ReplaceLiteralShape#inputValue} is received.
     */
    readonly outputValue: OutputValue
  ) {
    super();

    this._result = isEqual(inputValue, outputValue) ? null : { ok: true, value: outputValue };
  }

  deepPartial(): ReplaceLiteralShape<DeepPartialShape<BaseShape>, InputValue, OutputValue> {
    return new ReplaceLiteralShape(toDeepPartialShape(this.baseShape), this.inputValue, this.outputValue);
  }

  protected _isAsync(): boolean {
    return this.baseShape.isAsync;
  }

  protected _getInputs(): unknown[] {
    return this.baseShape.inputs.concat(this.inputValue);
  }

  protected _apply(
    input: unknown,
    options: ApplyOptions,
    nonce: number
  ): Result<ExcludeLiteral<Output<BaseShape>, InputValue> | OutputValue> {
    const result = isEqual(input, this.inputValue) ? this._result : this.baseShape['_apply'](input, options, nonce);

    return this._handleResult(result, input, options);
  }

  protected _applyAsync(
    input: unknown,
    options: ApplyOptions,
    nonce: number
  ): Promise<Result<ExcludeLiteral<Output<BaseShape>, InputValue> | OutputValue>> {
    if (isEqual(input, this.inputValue)) {
      return Promise.resolve(this._handleResult(this._result, input, options));
    }
    return this.baseShape['_applyAsync'](input, options, nonce).then(result =>
      this._handleResult(result, input, options)
    );
  }

  private _handleResult(
    result: Result,
    input: unknown,
    options: ApplyOptions
  ): Result<ExcludeLiteral<Output<BaseShape>, InputValue> | OutputValue> {
    let output = input;

    if (result !== null) {
      if (isArray(result)) {
        return result;
      }
      output = result.value;
    }
    return this._applyOperations(input, output, options, null);
  }
}

/**
 * The shape that prevents both input and output from being equal to a denied literal value.
 *
 * @template BaseShape The shape that parses the input without the denied value.
 * @template DeniedValue The denied value.
 * @group Shapes
 */
export class DenyLiteralShape<BaseShape extends AnyShape, DeniedValue>
  extends Shape<ExcludeLiteral<Input<BaseShape>, DeniedValue>, ExcludeLiteral<Output<BaseShape>, DeniedValue>>
  implements DeepPartialProtocol<DenyLiteralShape<DeepPartialShape<BaseShape>, DeniedValue>>
{
  /**
   * The constraint options or an issue message.
   */
  protected _options;

  /**
   * Returns issues associated with an invalid input value type.
   */
  protected _typeIssueFactory;

  /**
   * Creates the new {@linkcode DenyLiteralShape} instance.
   *
   * @param baseShape The shape that parses the input without the denied value.
   * @param deniedValue The dined value.
   * @param options The issue options or the issue message.
   * @template BaseShape The shape that parses the input without the denied value.
   * @template DeniedValue The denied value.
   */
  constructor(
    /**
     * The shape that parses the input without the denied value.
     */
    readonly baseShape: BaseShape,
    /**
     * The dined value.
     */
    readonly deniedValue: DeniedValue,
    options?: IssueOptions | Message
  ) {
    super();

    this._options = options;
    this._typeIssueFactory = createIssueFactory(CODE_DENIED, MESSAGE_DENIED, options, deniedValue);
  }

  deepPartial(): DenyLiteralShape<DeepPartialShape<BaseShape>, DeniedValue> {
    return new DenyLiteralShape(toDeepPartialShape(this.baseShape), this.deniedValue, this._options);
  }

  protected _isAsync(): boolean {
    return this.baseShape.isAsync;
  }

  protected _getInputs(): unknown[] {
    return this.baseShape.inputs.filter(input => !isEqual(this.deniedValue, input));
  }

  protected _apply(
    input: unknown,
    options: ApplyOptions,
    nonce: number
  ): Result<ExcludeLiteral<Output<BaseShape>, DeniedValue>> {
    if (isEqual(input, this.deniedValue)) {
      return [this._typeIssueFactory(input, options)];
    }
    return this._handleResult(this.baseShape['_apply'](input, options, nonce), input, options);
  }

  protected _applyAsync(
    input: unknown,
    options: ApplyOptions,
    nonce: number
  ): Promise<Result<ExcludeLiteral<Output<BaseShape>, DeniedValue>>> {
    if (isEqual(input, this.deniedValue)) {
      return Promise.resolve([this._typeIssueFactory(input, options)]);
    }
    return this.baseShape['_applyAsync'](input, options, nonce).then(result =>
      this._handleResult(result, input, options)
    );
  }

  private _handleResult(
    result: Result,
    input: unknown,
    options: ApplyOptions
  ): Result<ExcludeLiteral<Output<BaseShape>, DeniedValue>> {
    let output = input;

    if (result !== null) {
      if (isArray(result)) {
        return result;
      }
      output = result.value;

      if (isEqual(output, this.deniedValue)) {
        return [this._typeIssueFactory(input, options)];
      }
    }
    return this._applyOperations(input, output, options, null);
  }
}

/**
 * The shape that returns the fallback value if parsing fails.
 *
 * @template BaseShape The shape that parses the input.
 * @template FallbackValue The fallback value.
 * @group Shapes
 */
export class CatchShape<BaseShape extends AnyShape, FallbackValue>
  extends Shape<Input<BaseShape>, Output<BaseShape> | FallbackValue>
  implements DeepPartialProtocol<CatchShape<DeepPartialShape<BaseShape>, FallbackValue>>
{
  private _resultProvider: (input: unknown, issues: Issue[], options: ApplyOptions) => Ok<FallbackValue>;

  /**
   * Creates the new {@linkcode CatchShape} instance.
   *
   * @param baseShape The shape that parses the input.
   * @param fallback The value or a callback that returns a value that is returned if parsing has failed.
   * @template BaseShape The shape that parses the input.
   * @template FallbackValue The fallback value.
   */
  constructor(
    /**
     * The shape that parses the input.
     */
    readonly baseShape: BaseShape,
    /**
     * The value or a callback that returns a value that is returned if parsing has failed.
     *
     *  A callback receives an input value, an array of raised issues, and {@link ApplyOptions parsing options}.
     */
    readonly fallback: FallbackValue | ((input: any, issues: Issue[], options: ApplyOptions) => FallbackValue)
  ) {
    super();

    if (typeof fallback === 'function') {
      this._resultProvider = (input, issues, options) => ok((fallback as Function)(input, issues, options));
    } else {
      const result: Ok<FallbackValue> = { ok: true, value: fallback };
      this._resultProvider = () => result;
    }
  }

  deepPartial(): CatchShape<DeepPartialShape<BaseShape>, FallbackValue> {
    return new CatchShape(toDeepPartialShape(this.baseShape), this.fallback);
  }

  protected _isAsync(): boolean {
    return this.baseShape.isAsync;
  }

  protected _getInputs(): unknown[] {
    return this.baseShape.inputs.slice(0);
  }

  protected _apply(input: unknown, options: ApplyOptions, nonce: number): Result<Output<BaseShape> | FallbackValue> {
    return this._handleResult(this.baseShape['_apply'](input, options, nonce), input, options);
  }

  protected _applyAsync(
    input: unknown,
    options: ApplyOptions,
    nonce: number
  ): Promise<Result<Output<BaseShape> | FallbackValue>> {
    return this.baseShape['_applyAsync'](input, options, nonce).then(result =>
      this._handleResult(result, input, options)
    );
  }

  private _handleResult(
    result: Result,
    input: unknown,
    options: ApplyOptions
  ): Result<Output<BaseShape> | FallbackValue> {
    let output = input;

    if (result !== null) {
      if (isArray(result)) {
        try {
          result = this._resultProvider(input, result, options);
        } catch (error) {
          return captureIssues(error);
        }
      }
      output = result.value;
    }
    return this._applyOperations(input, output, options, null);
  }
}

/**
 * Checks that the input doesn't match the shape.
 *
 * @template BaseShape The base shape.
 * @template ExcludedShape The shape to which the output must not conform.
 * @group Shapes
 */
export class ExcludeShape<BaseShape extends AnyShape, ExcludedShape extends AnyShape>
  extends Shape<Input<BaseShape>, Exclude<Output<BaseShape>, Input<ExcludedShape>>>
  implements DeepPartialProtocol<ExcludeShape<DeepPartialShape<BaseShape>, ExcludedShape>>
{
  /**
   * The constraint options or an issue message.
   */
  protected _options;

  /**
   * Returns issues associated with an invalid input value type.
   */
  protected _typeIssueFactory;

  /**
   * Creates the new {@linkcode ExcludeShape} instance.
   *
   * @param baseShape The shape that parses the input.
   * @param excludedShape The shape to which the output must not conform.
   * @param options The issue options or the issue message.
   * @template BaseShape The base shape.
   * @template ExcludedShape The shape to which the output must not conform.
   */
  constructor(
    /**
     * The base shape.
     */
    readonly baseShape: BaseShape,
    /**
     * The shape to which the output must not conform.
     */
    readonly excludedShape: ExcludedShape,
    options?: IssueOptions | Message
  ) {
    super();

    this._options = options;
    this._typeIssueFactory = createIssueFactory(CODE_EXCLUDED, MESSAGE_EXCLUDED, options, excludedShape);
  }

  deepPartial(): ExcludeShape<DeepPartialShape<BaseShape>, ExcludedShape> {
    return new ExcludeShape(toDeepPartialShape(this.baseShape), this.excludedShape, this._options);
  }

  protected _isAsync(): boolean {
    return this.baseShape.isAsync || this.excludedShape.isAsync;
  }

  protected _getInputs(): unknown[] {
    return this.baseShape.inputs.filter(input => isType(input) || !this.excludedShape.inputs.includes(input));
  }

  protected _apply(
    input: unknown,
    options: ApplyOptions,
    nonce: number
  ): Result<Exclude<Output<BaseShape>, Input<ExcludedShape>>> {
    const { baseShape, excludedShape } = this;

    let output = input;

    let result = baseShape['_apply'](input, options, nonce);

    if (result !== null) {
      if (isArray(result)) {
        return result;
      }
      output = result.value;
    }

    if (!isArray(excludedShape['_apply'](output, options, nonce))) {
      return [this._typeIssueFactory(input, options)];
    }
    return this._applyOperations(input, output, options, null);
  }

  protected _applyAsync(
    input: unknown,
    options: ApplyOptions,
    nonce: number
  ): Promise<Result<Exclude<Output<BaseShape>, Input<ExcludedShape>>>> {
    const { baseShape, excludedShape } = this;

    return baseShape['_applyAsync'](input, options, nonce).then(result => {
      let output = input;

      if (result !== null) {
        if (isArray(result)) {
          return result;
        }
        output = result.value;
      }

      return applyShape(excludedShape, output, options, nonce, outputResult => {
        if (!isArray(outputResult)) {
          return [this._typeIssueFactory(input, options)];
        }
        return this._applyOperations(input, output, options, null);
      });
    });
  }
}
