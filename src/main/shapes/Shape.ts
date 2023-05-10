import {
  CODE_DENIED,
  CODE_EXCLUDED,
  CODE_PREDICATE,
  ERROR_REQUIRES_ASYNC,
  MESSAGE_DENIED,
  MESSAGE_EXCLUDED,
  MESSAGE_PREDICATE,
} from '../constants';
import { getTypeOf, TYPE_UNKNOWN } from '../Type';
import {
  ApplyOptions,
  Check,
  CheckCallback,
  CheckOptions,
  ConstraintOptions,
  Err,
  Issue,
  Literal,
  Message,
  Ok,
  ParseOptions,
  RefineOptions,
} from '../types';
import {
  applyShape,
  captureIssues,
  copyUnsafeChecks,
  createIssueFactory,
  deleteAt,
  Dict,
  getCheckIndex,
  getErrorMessage,
  isArray,
  isEqual,
  isObjectLike,
  isType,
  nextNonce,
  ok,
  ReadonlyDict,
  replaceChecks,
  returnTrue,
  toDeepPartialShape,
  unionTypes,
} from '../utils';
import { ValidationError } from '../ValidationError';

/**
 * The marker object that is used to denote an impossible value. For example, `NEVER` is returned from `_coerce`
 * method, that is present on various shapes, when coercion is not possible.
 */
export const NEVER = Object.freeze({}) as never;

export const defaultApplyOptions = Object.freeze<ApplyOptions>({ verbose: false, coerced: false });

/**
 * Excludes `U` from `T` only if `U` is a literal type.
 */
// prettier-ignore
export type ExcludeLiteral<T, U> =
  number extends U ? T :
  string extends U ? T :
  symbol extends U ? T :
  bigint extends U ? T :
  object extends U ? T :
  boolean extends U ? T :
  Exclude<T, U>;

/**
 * An arbitrary shape.
 */
export type AnyShape = Shape | Shape<never>;

/**
 * An alias for {@linkcode ReplaceLiteralShape} that allows the same value as both an input and an output.
 *
 * @template BaseShape The shape that parses the input without the replaced value.
 * @template AllowedValue The value that is allowed as an input and output.
 */
// prettier-ignore
export type AllowLiteralShape<BaseShape extends AnyShape, AllowedValue> =
  ReplaceLiteralShape<BaseShape, AllowedValue, AllowedValue>;

/**
 * An alias for {@linkcode ExcludeShape} that doesn't impose the exclusion on the type level.
 *
 * @template BaseShape The base shape.
 * @template ExcludedShape The shape to which the output must not conform.
 */
export interface NotShape<BaseShape extends AnyShape, ExcludedShape extends AnyShape>
  extends Shape<BaseShape[INPUT], BaseShape[OUTPUT]>,
    DeepPartialProtocol<NotShape<DeepPartialShape<BaseShape>, ExcludedShape>> {
  /**
   * The base shape.
   */
  readonly shape: BaseShape;

  /**
   * The shape to which the output must not conform.
   */
  readonly excludedShape: ExcludedShape;
}

/**
 * This symbol doesn't exist at runtime!
 *
 * The ephemeral unique symbol that is used for type branding by {@linkcode Branded}.
 */
declare const BRAND: unique symbol;

/**
 * The branded type.
 *
 * @template Value The value to brand.
 * @template BrandValue The brand value.
 */
export type Branded<Value, BrandValue> = Value & { [BRAND]: BrandValue };

/**
 * The shape that adds a brand to the output type. This shape doesn't affect the runtime and is used for emulation of
 * nominal typing.
 *
 * @template BaseShape The shape which output must be branded.
 * @template BrandValue The brand value.
 */
// prettier-ignore
export type BrandShape<BaseShape extends AnyShape & Partial<DeepPartialProtocol<AnyShape>>, BrandValue> =
  & Shape<BaseShape[INPUT], Branded<BaseShape[OUTPUT], BrandValue>>
  & Pick<BaseShape, keyof DeepPartialProtocol<AnyShape>>;

/**
 * A shape should implement {@linkcode DeepPartialProtocol} to support conversion to a deep partial alternative.
 *
 * @template S The deep partial alternative of the shape.
 */
export interface DeepPartialProtocol<S extends AnyShape> {
  /**
   * Converts the shape and its child shapes to deep partial alternatives.
   *
   * @returns The deep partial clone of the shape.
   */
  deepPartial(): S;
}

/**
 * Returns the deep partial alternative of the shape if it implements {@linkcode DeepPartialProtocol}, or returns shape
 * as is if it doesn't.
 *
 * @template S The shape to convert to a deep partial alternative.
 */
export type DeepPartialShape<S extends AnyShape> = S extends DeepPartialProtocol<infer T> ? T : S;

/**
 * Shape that is both optional and deep partial.
 *
 * @template S The shape to convert to an optional deep partial alternative.
 */
export type OptionalDeepPartialShape<S extends AnyShape> = AllowLiteralShape<DeepPartialShape<S>, undefined>;

/**
 * The result that shape returns after being applied to an input value. This is the part of the internal API required
 * for creating custom shapes.
 */
export type Result<T = any> = Ok<T> | Issue[] | null;

/**
 * The callback to which shape checks are compiled, see {@linkcode Shape._applyChecks}.
 */
export type ApplyChecksCallback = (output: any, issues: Issue[] | null, options: ApplyOptions) => Issue[] | null;

export type INPUT = '__input';
export type OUTPUT = '__output';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

/**
 * Extracts the shape input type.
 *
 * @template S The shape from which the input type must be inferred.
 */
export type Input<S extends AnyShape> = S[INPUT];

/**
 * Extracts the shape output type.
 *
 * @template S The shape from which the output type must be inferred.
 */
export type Output<S extends AnyShape> = S[OUTPUT];

/**
 * The baseline shape implementation.
 *
 * @template InputValue The input value.
 * @template OutputValue The output value.
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
   * The dictionary of shape annotations. Use {@linkcode annotate} to add new annotations via DSL.
   */
  annotations: Dict = {};

  /**
   * The array of checks that were used to produce {@linkcode _applyChecks}.
   */
  protected _checks: readonly Check[] = [];

  /**
   * A callback that applies checks to the given value.
   */
  protected _applyChecks: ApplyChecksCallback | null = null;

  /**
   * `true` if some checks from {@linkcode _checks} were marked as unsafe, `false` otherwise.
   */
  protected _isUnsafe = false;

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
   */
  annotate(annotations: ReadonlyDict): this {
    const shape = this._clone();
    shape.annotations = Object.assign({}, this.annotations, annotations);
    return shape;
  }

  /**
   * Adds the check that is applied to the shape output.
   *
   * If the {@linkcode CheckOptions.key} is defined and there's already a check with the same key then the existing
   * check is deleted and the new one is appended. If the key is `undefined` then the `cb` identity is used as a key.
   *
   * If check callback returns an empty array, it is considered that no issues have occurred.
   *
   * @param cb The callback that checks the shape output.
   * @param options The check options.
   * @returns The clone of the shape.
   * @template ParamValue The check param value, passed to {@link CheckCallback the check callback}.
   */
  check<ParamValue>(cb: CheckCallback<OutputValue, ParamValue>, options: CheckOptions & { param: ParamValue }): this;

  /**
   * Adds the check that is applied to the shape output.
   *
   * If the {@linkcode CheckOptions.key} is defined and there's already a check with the same key then the existing
   * check is deleted and the new one is appended. If the key is `undefined` then the `cb` identity is used as a key.
   *
   * If check callback returns an empty array, it is considered that no issues have occurred.
   *
   * @param cb The callback that checks the shape output.
   * @param options The check options.
   * @returns The clone of the shape.
   */
  check(cb: CheckCallback<OutputValue>, options?: CheckOptions): this;

  check(cb: CheckCallback, options: CheckOptions = {}): this {
    const { key = cb, param, unsafe = false } = options;

    const index = getCheckIndex(this._checks, key);
    const checks = this._checks.concat({ key, callback: cb, param, isUnsafe: unsafe });

    return replaceChecks(this._clone(), deleteAt(checks, index));
  }

  /**
   * Returns the {@linkcode Check} by its key.
   *
   * @param key The check key.
   * @returns The check or `undefined` if there's no check associated with the key.
   */
  getCheck(key: unknown): Check | undefined {
    const index = getCheckIndex(this._checks, key);

    return index !== -1 ? this._checks[index] : undefined;
  }

  /**
   * Returns `true` if the shape has the check with the given key, or `false` otherwise.
   *
   * @param key The check key.
   */
  hasCheck(key: unknown): boolean {
    return getCheckIndex(this._checks, key) !== -1;
  }

  /**
   * Deletes the check from the shape.
   *
   * @param key The check key.
   * @returns The clone of the shape if the matching check was deleted, or this shape if there is no matching check.
   */
  deleteCheck(key: unknown): this {
    const index = getCheckIndex(this._checks, key);

    return index !== -1 ? replaceChecks(this._clone(), deleteAt(this._checks.slice(0), index)) : this;
  }

  /**
   * Refines the shape output type with the
   * [narrowing predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html).
   *
   * @param cb The predicate that returns `true` if value conforms the required type, or `false` otherwise.
   * @param options The constraint options or an issue message.
   * @returns The shape with the narrowed output.
   * @template RefinedOutputValue The narrowed output value.
   */
  refine<RefinedOutputValue extends OutputValue>(
    /**
     * @param output The shape output value.
     * @param options Parsing options.
     * @return `true` if value matches the predicate, or `false` otherwise.
     * @throws {@linkcode ValidationError} to notify that the refinement cannot be completed.
     */
    cb: (output: OutputValue, options: Readonly<ApplyOptions>) => output is RefinedOutputValue,
    options?: RefineOptions | Message
  ): Shape<InputValue, RefinedOutputValue>;

  /**
   * Checks that the output value conforms the predicate.
   *
   * @param cb The predicate that returns truthy result if value is valid, or returns falsy result otherwise.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  refine(
    /**
     * @param output The shape output value.
     * @param options Parsing options.
     * @return `true` if value matches the predicate, or `false` otherwise.
     * @throws {@linkcode ValidationError} to notify that the refinement cannot be completed.
     */
    cb: (output: OutputValue, options: Readonly<ApplyOptions>) => boolean,
    options?: RefineOptions | Message
  ): this;

  refine(cb: (output: OutputValue, options: Readonly<ApplyOptions>) => unknown, options?: RefineOptions | Message) {
    const { key = cb, code = CODE_PREDICATE, unsafe = false } = isObjectLike<RefineOptions>(options) ? options : {};

    const issueFactory = createIssueFactory(code, MESSAGE_PREDICATE, options, cb);

    return this.check(
      (input, param, options) => {
        if (!cb(input, options)) {
          return issueFactory(input, options);
        }
      },
      { key, param: cb, unsafe }
    );
  }

  /**
   * Pipes the output of this shape to the input of another shape.
   *
   * @param shape The shape that validates the output if this shape.
   * @returns The {@linkcode PipeShape} instance.
   * @template OutputShape The output value.
   */
  to<OutputShape extends AnyShape>(shape: OutputShape): PipeShape<this, OutputShape> {
    return new PipeShape(this, shape);
  }

  /**
   * Synchronously transforms the output value of the shape with a transformer callback.
   *
   * @param cb The callback that transforms the shape output value.
   * @returns The {@linkcode TransformShape} instance.
   * @template TransformedValue The value returned from the callback that transforms the output value of this shape.
   */
  transform<TransformedValue>(
    /**
     * @param output The shape output value.
     * @param options Parsing options.
     * @return The transformed value.
     * @throws {@linkcode ValidationError} to notify that the transformation cannot be successfully completed.
     */
    cb: (output: OutputValue, options: Readonly<ApplyOptions>) => TransformedValue
  ): Shape<InputValue, TransformedValue> {
    return this.to(new TransformShape(cb));
  }

  /**
   * Asynchronously transforms the output value of the shape with a transformer callback.
   *
   * @param cb The callback that transforms the shape output value.
   * @returns The {@linkcode TransformShape} instance.
   * @template TransformedValue The value returned from the callback that transforms the output value of this shape.
   */
  transformAsync<TransformedValue>(
    /**
     * @param output The shape output value.
     * @param options Parsing options.
     * @return The transformed value.
     * @throws {@linkcode ValidationError} to notify that the transformation cannot be successfully completed.
     */
    cb: (output: OutputValue, options: Readonly<ApplyOptions>) => Promise<TransformedValue>
  ): Shape<InputValue, TransformedValue> {
    return this.to(new TransformShape(cb, true));
  }

  /**
   * Returns an opaque shape that adds a brand to the output type.
   *
   * @returns A shape with the branded output type.
   * @template BrandValue The brand value.
   */
  brand<BrandValue = this>(): BrandShape<this, BrandValue> {
    return this as BrandShape<this, BrandValue>;
  }

  /**
   * Replaces an input value with an output value.
   *
   * @param inputValue The input value to replace.
   * @param outputValue The output value that is returned if an `inputValue` is received.
   * @returns The {@linkcode ReplaceLiteralShape} instance.
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
   * @returns The {@linkcode ReplaceLiteralShape} instance.
   * @template AllowedValue The allowed value.
   */
  allow<AllowedValue extends Literal>(value: AllowedValue): AllowLiteralShape<this, AllowedValue> {
    return this.replace(value, value);
  }

  /**
   * Excludes value from both input and output.
   *
   * @param value The excluded value.
   * @param options The constraint options or an issue message.
   * @returns The {@linkcode DenyLiteralShape} instance.
   * @template DeniedValue The denied value.
   */
  deny<DeniedValue extends InputValue | OutputValue>(
    value: DeniedValue,
    options?: ConstraintOptions | Message
  ): DenyLiteralShape<this, DeniedValue> {
    return new DenyLiteralShape(this, value, options);
  }

  /**
   * Replaces `undefined` input value with an `undefined` output value.
   *
   * @returns The {@linkcode ReplaceLiteralShape} instance.
   */
  optional(): AllowLiteralShape<this, undefined>;

  /**
   * Replaces `undefined` input value with a default output value.
   *
   * @param defaultValue The value that should be used if an input value is `undefined`.
   * @template DefaultValue The value that is used as the replacement for `undefined`.
   * @returns The {@linkcode ReplaceLiteralShape} instance.
   */
  optional<DefaultValue extends Literal>(
    defaultValue: DefaultValue
  ): ReplaceLiteralShape<this, undefined, DefaultValue>;

  optional(defaultValue?: any) {
    return this.replace(undefined, defaultValue);
  }

  /**
   * Replaces `null` input value with an `null` output value.
   *
   * @returns The {@linkcode ReplaceLiteralShape} instance.
   */
  nullable(): AllowLiteralShape<this, null>;

  /**
   * Replaces `null` input value with a default output value.
   *
   * @param defaultValue The value that should be used if an input value is `null`.
   * @template DefaultValue The value that is used as the replacement for `null`.
   * @returns The {@linkcode ReplaceLiteralShape} instance.
   */
  nullable<DefaultValue extends Literal>(defaultValue: DefaultValue): ReplaceLiteralShape<this, null, DefaultValue>;

  nullable(defaultValue?: any) {
    return this.replace(null, arguments.length === 0 ? null : defaultValue);
  }

  /**
   * Passes `null` and `undefined` input values directly to the output without parsing.
   *
   * @returns The {@linkcode ReplaceLiteralShape} instance.
   */
  nullish(): AllowLiteralShape<AllowLiteralShape<this, null>, undefined>;

  /**
   * Replaces `null` and `undefined` input value with a default output value.
   *
   * @param defaultValue The value that should be used if an input value is `undefined` or `null`.
   * @template DefaultValue The value that is used as the replacement for `undefined` and `null`.
   * @returns The {@linkcode ReplaceLiteralShape} instance.
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
   * @param options The constraint options or an issue message.
   * @returns The {@linkcode DenyLiteralShape} instance.
   */
  nonOptional(options?: ConstraintOptions | Message): DenyLiteralShape<this, undefined> {
    return new DenyLiteralShape(this, undefined, options);
  }

  /**
   * Returns `undefined` if parsing fails.
   *
   * @returns The {@linkcode CatchShape} instance.
   */
  catch(): CatchShape<this, undefined>;

  /**
   * Returns the fallback value if parsing fails.
   *
   * @param fallback The value or a callback that returns a value that is returned if parsing has failed. A callback
   * receives an input value, an array of raised issues, and {@link ApplyOptions parsing options}.
   * @template FallbackValue The fallback value.
   * @returns The {@linkcode CatchShape} instance.
   */
  catch<FallbackValue extends Literal>(
    fallback: FallbackValue | ((input: any, issues: Issue[], options: Readonly<ApplyOptions>) => FallbackValue)
  ): CatchShape<this, FallbackValue>;

  catch(fallback?: unknown): Shape {
    return new CatchShape(this, fallback);
  }

  /**
   * Checks that the input doesn't match the shape.
   *
   * @param shape The shape to which the output must not conform.
   * @param options The constraint options or an issue message.
   * @template ExcludedShape The shape to which the output must not conform.
   * @returns The {@linkcode ExcludeShape} instance.
   */
  exclude<ExcludedShape extends AnyShape>(
    shape: ExcludedShape,
    options?: ConstraintOptions | Message
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
   * @param options The constraint options or an issue message.
   * @template ExcludedShape The shape to which the output must not conform.
   * @returns The {@linkcode ExcludeShape} instance.
   */
  not<ExcludedShape extends AnyShape>(
    shape: ExcludedShape,
    options?: ConstraintOptions | Message
  ): NotShape<this, ExcludedShape> {
    return this.exclude(shape, options);
  }

  /**
   * Must return `true` if the shape must be used in async context only, otherwise the shape can be used in both sync
   * and async contexts. Override this method to implement a custom shape.
   */
  protected _isAsync(): boolean {
    return false;
  }

  /**
   * Returns input types and literal values that this shape can accept as an input.
   */
  protected _getInputs(): unknown[] {
    return [TYPE_UNKNOWN];
  }

  /**
   * Clones the shape.
   */
  protected _clone(): this {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
  }

  /**
   * Synchronously parses the input.
   *
   * @param input The shape input to parse.
   * @param options Parsing options.
   * @param nonce The globally unique number that identifies the parsing process.
   * @returns `null` if input matches the output, {@linkcode Ok} that wraps the output, or an array of captured issues.
   */
  protected _apply(input: unknown, options: ApplyOptions, nonce: number): Result<OutputValue> {
    const { _applyChecks } = this;

    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }

  /**
   * Asynchronously parses the input.
   *
   * @param input The shape input to parse.
   * @param options Parsing options.
   * @param nonce The globally unique number that identifies the parsing process.
   * @returns `null` if input matches the output, {@linkcode Ok} that wraps the output, or an array of captured issues.
   */
  protected _applyAsync(input: unknown, options: ApplyOptions, nonce: number): Promise<Result<OutputValue>> {
    return new Promise(resolve => resolve(this._apply(input, options, nonce)));
  }
}

export interface Shape<InputValue, OutputValue> {
  /**
   * The array of unique input types and values that are accepted by the shape.
   */
  readonly inputs: readonly unknown[];

  /**
   * `true` if the shape allows only {@linkcode parseAsync} and throws an error if {@linkcode parse} is called.
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
  parseAsync(input: unknown, options?: ParseOptions): Promise<OutputValue>;

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
  parseOrDefaultAsync(input: unknown): Promise<OutputValue | undefined>;

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
  ): Promise<OutputValue | DefaultValue>;
}

Object.defineProperties(Shape.prototype, {
  inputs: {
    configurable: true,

    get(this: Shape) {
      Object.defineProperty(this, 'inputs', { configurable: true, value: [] });

      const inputs = Object.freeze(unionTypes(this['_getInputs']()));

      Object.defineProperty(this, 'inputs', { configurable: true, value: inputs });

      return inputs;
    },
  },

  isAsync: {
    configurable: true,

    get(this: Shape) {
      Object.defineProperty(this, 'isAsync', { configurable: true, value: false });

      const async = this._isAsync();
      const _defaultApplyAsync = Shape.prototype['_applyAsync'];

      if (async) {
        this._apply = () => {
          throw new Error(ERROR_REQUIRES_ASYNC);
        };
      } else if (this._applyAsync !== _defaultApplyAsync) {
        this._applyAsync = _defaultApplyAsync;
      }

      Object.defineProperty(this, 'isAsync', { configurable: true, value: async });

      return async;
    },
  },

  try: {
    configurable: true,

    get(this: Shape) {
      this.isAsync;

      const cb: Shape['try'] = (input, options) => {
        const result = this._apply(input, options || defaultApplyOptions, nextNonce());

        if (result === null) {
          return ok(input);
        }
        if (isArray(result)) {
          return { ok: false, issues: result };
        }
        return ok(result.value);
      };

      Object.defineProperty(this, 'try', { writable: true, value: cb });

      return cb;
    },
  },

  tryAsync: {
    configurable: true,

    get(this: Shape) {
      this.isAsync;

      const cb: Shape['tryAsync'] = (input, options) => {
        return this._applyAsync(input, options || defaultApplyOptions, nextNonce()).then(result => {
          if (result === null) {
            return ok(input);
          }
          if (isArray(result)) {
            return { ok: false, issues: result };
          }
          return result;
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

      const cb: Shape['parse'] = (input, options) => {
        const result = this._apply(input, options || defaultApplyOptions, nextNonce());

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

      const cb: Shape['parseAsync'] = (input, options) => {
        return this._applyAsync(input, options || defaultApplyOptions, nextNonce()).then(result => {
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

      const cb: Shape['parseOrDefault'] = (input: unknown, defaultValue?: unknown, options?: ApplyOptions) => {
        const result = this._apply(input, options || defaultApplyOptions, nextNonce());

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

      const cb: Shape['parseOrDefaultAsync'] = (input: unknown, defaultValue?: unknown, options?: ApplyOptions) => {
        return this._applyAsync(input, options || defaultApplyOptions, nextNonce()).then(result => {
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
});

/**
 * The shape that applies a transformer callback to the input.
 *
 * @template TransformedValue The output value of the callback that transforms the input value.
 */
export class TransformShape<TransformedValue> extends Shape<any, TransformedValue> {
  /**
   * Creates the new {@linkcode TransformShape} instance.
   *
   * @param callback The callback that transforms the input value.
   * @param async If `true` then the transform shape waits for the promise returned from the callback to be
   * fulfilled. Otherwise, the value that is synchronously returned from the callback is used as an output.
   * @template TransformedValue The output value of the callback that transforms the input value.
   */
  constructor(
    /**
     * The callback that transforms the input value.
     *
     * @param value The input value.
     * @param options Parsing options.
     * @return The transformation result.
     * @throws {@linkcode ValidationError} to notify that the transformation cannot be successfully completed.
     */
    readonly callback: (
      value: any,
      options: Readonly<ApplyOptions>
    ) => PromiseLike<TransformedValue> | TransformedValue,
    async?: boolean
  ) {
    super();

    if (async) {
      this._isAsync = returnTrue;
    }
  }

  protected _apply(input: unknown, options: ApplyOptions, nonce: number): Result<TransformedValue> {
    const { callback, _applyChecks } = this;

    let issues = null;
    let output;

    try {
      output = callback(input, options) as TransformedValue;
    } catch (error) {
      return captureIssues(error);
    }

    if ((_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) && !isEqual(input, output)) {
      return ok(output);
    }
    return issues;
  }

  protected _applyAsync(input: unknown, options: ApplyOptions, nonce: number): Promise<Result<TransformedValue>> {
    const { _applyChecks } = this;

    return new Promise<TransformedValue>(resolve => resolve(this.callback(input, options))).then(output => {
      let issues = null;

      if (
        (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) &&
        !isEqual(input, output)
      ) {
        return ok(output);
      }
      return issues;
    }, captureIssues);
  }
}

/**
 * The shape that parses the output of the input shape with the output shape.
 *
 * @template InputShape The input shape.
 * @template OutputShape The output shape.
 */
export class PipeShape<InputShape extends AnyShape, OutputShape extends AnyShape>
  extends Shape<InputShape[INPUT], OutputShape[OUTPUT]>
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
    return copyUnsafeChecks(
      this,
      new PipeShape(toDeepPartialShape(this.inputShape), toDeepPartialShape(this.outputShape))
    );
  }

  protected _isAsync(): boolean {
    return this.inputShape.isAsync || this.outputShape.isAsync;
  }

  protected _getInputs(): unknown[] {
    return this.inputShape.inputs.slice(0);
  }

  protected _apply(input: unknown, options: ApplyOptions, nonce: number): Result<OutputShape[OUTPUT]> {
    const { inputShape, outputShape, _applyChecks } = this;

    let issues;
    let output = input;

    let result = inputShape['_apply'](input, options, nonce);

    if (result !== null) {
      if (isArray(result)) {
        return result;
      }
      output = result.value;
    }

    const outputResult = outputShape['_apply'](output, options, nonce);

    if (outputResult !== null) {
      if (isArray(outputResult)) {
        return outputResult;
      }
      result = outputResult;
      output = outputResult.value;
    }

    if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
      return result;
    }
    return issues;
  }

  protected _applyAsync(input: unknown, options: ApplyOptions, nonce: number): Promise<Result<OutputShape[OUTPUT]>> {
    const { inputShape, outputShape, _applyChecks } = this;

    return inputShape['_applyAsync'](input, options, nonce).then(result => {
      let output = input;

      if (result !== null) {
        if (isArray(result)) {
          return result;
        }
        output = result.value;
      }

      return applyShape(outputShape, output, options, nonce, outputResult => {
        let issues;

        if (outputResult !== null) {
          if (isArray(outputResult)) {
            return outputResult;
          }
          result = outputResult;
          output = outputResult.value;
        }

        if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
          return result;
        }
        return issues;
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
 */
export class ReplaceLiteralShape<BaseShape extends AnyShape, InputValue, OutputValue>
  extends Shape<BaseShape[INPUT] | InputValue, ExcludeLiteral<BaseShape[OUTPUT], InputValue> | OutputValue>
  implements DeepPartialProtocol<ReplaceLiteralShape<DeepPartialShape<BaseShape>, InputValue, OutputValue>>
{
  private _result: Result<OutputValue>;

  /**
   * Creates the new {@linkcode ReplaceLiteralShape} instance.
   *
   * @param shape The shape that parses the input without the replaced value.
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
    readonly shape: BaseShape,
    /**
     * The input value to replace.
     */
    readonly inputValue: InputValue,
    /**
     * The output value that is returned if an {@linkcode inputValue} is received.
     */
    readonly outputValue: OutputValue
  ) {
    super();

    this._result = isEqual(inputValue, outputValue) ? null : ok(outputValue);
  }

  deepPartial(): ReplaceLiteralShape<DeepPartialShape<BaseShape>, InputValue, OutputValue> {
    return copyUnsafeChecks(
      this,
      new ReplaceLiteralShape(toDeepPartialShape(this.shape), this.inputValue, this.outputValue)
    );
  }

  protected _isAsync(): boolean {
    return this.shape.isAsync;
  }

  protected _getInputs(): unknown[] {
    return this.shape.inputs.concat(this.inputValue);
  }

  protected _apply(
    input: unknown,
    options: ApplyOptions,
    nonce: number
  ): Result<ExcludeLiteral<BaseShape[OUTPUT], InputValue> | OutputValue> {
    const result = isEqual(input, this.inputValue) ? this._result : this.shape['_apply'](input, options);

    return this._handleResult(result, input, options);
  }

  protected _applyAsync(
    input: unknown,
    options: ApplyOptions,
    nonce: number
  ): Promise<Result<ExcludeLiteral<BaseShape[OUTPUT], InputValue> | OutputValue>> {
    if (isEqual(input, this.inputValue)) {
      return Promise.resolve(this._handleResult(this._result, input, options));
    }
    return this.shape['_applyAsync'](input, options, nonce).then(result => this._handleResult(result, input, options));
  }

  private _handleResult(
    result: Result,
    input: unknown,
    options: ApplyOptions
  ): Result<ExcludeLiteral<BaseShape[OUTPUT], InputValue> | OutputValue> {
    const { _applyChecks } = this;

    let issues;
    let output = input;

    if (result !== null) {
      if (isArray(result)) {
        return result;
      }
      output = result.value;
    }

    if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
      return result;
    }
    return issues;
  }
}

/**
 * The shape that prevents both input and output from being equal to a denied literal value.
 *
 * @template BaseShape The shape that parses the input without the denied value.
 * @template DeniedValue The denied value.
 */
export class DenyLiteralShape<BaseShape extends AnyShape, DeniedValue>
  extends Shape<ExcludeLiteral<BaseShape[INPUT], DeniedValue>, ExcludeLiteral<BaseShape[OUTPUT], DeniedValue>>
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
   * @param shape The shape that parses the input without the denied value.
   * @param deniedValue The dined value.
   * @param options The constraint options or an issue message.
   * @template BaseShape The shape that parses the input without the denied value.
   * @template DeniedValue The denied value.
   */
  constructor(
    /**
     * The shape that parses the input without the denied value.
     */
    readonly shape: BaseShape,
    /**
     * The dined value.
     */
    readonly deniedValue: DeniedValue,
    options?: ConstraintOptions | Message
  ) {
    super();

    this._options = options;
    this._typeIssueFactory = createIssueFactory(CODE_DENIED, MESSAGE_DENIED, options, deniedValue);
  }

  deepPartial(): DenyLiteralShape<DeepPartialShape<BaseShape>, DeniedValue> {
    return copyUnsafeChecks(
      this,
      new DenyLiteralShape(toDeepPartialShape(this.shape), this.deniedValue, this._options)
    );
  }

  protected _isAsync(): boolean {
    return this.shape.isAsync;
  }

  protected _getInputs(): unknown[] {
    return this.shape.inputs.filter(input => !isEqual(this.deniedValue, input));
  }

  protected _apply(input: unknown, options: ApplyOptions, nonce: number): Result<ExcludeLiteral<BaseShape[OUTPUT], DeniedValue>> {
    if (isEqual(input, this.deniedValue)) {
      return this._typeIssueFactory(input, options);
    }
    return this._handleResult(this.shape['_apply'](input, options, nonce), input, options);
  }

  protected _applyAsync(
    input: unknown,
    options: ApplyOptions,
    nonce: number
  ): Promise<Result<ExcludeLiteral<BaseShape[OUTPUT], DeniedValue>>> {
    if (isEqual(input, this.deniedValue)) {
      return Promise.resolve(this._typeIssueFactory(input, options));
    }
    return this.shape['_applyAsync'](input, options, nonce).then(result => this._handleResult(result, input, options));
  }

  private _handleResult(
    result: Result,
    input: unknown,
    options: ApplyOptions
  ): Result<ExcludeLiteral<BaseShape[OUTPUT], DeniedValue>> {
    const { _applyChecks } = this;

    let issues;
    let output = input;

    if (result !== null) {
      if (isArray(result)) {
        return result;
      }
      output = result.value;

      if (isEqual(output, this.deniedValue)) {
        return this._typeIssueFactory(input, options);
      }
    }

    if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
      return result;
    }
    return issues;
  }
}

/**
 * The shape that returns the fallback value if parsing fails.
 *
 * @template BaseShape The shape that parses the input.
 * @template FallbackValue The fallback value.
 */
export class CatchShape<BaseShape extends AnyShape, FallbackValue>
  extends Shape<BaseShape[INPUT], BaseShape[OUTPUT] | FallbackValue>
  implements DeepPartialProtocol<CatchShape<DeepPartialShape<BaseShape>, FallbackValue>>
{
  private _resultProvider: (input: unknown, issues: Issue[], options: Readonly<ApplyOptions>) => Ok<FallbackValue>;

  /**
   * Creates the new {@linkcode CatchShape} instance.
   *
   * @param shape The shape that parses the input.
   * @param fallback The value or a callback that returns a value that is returned if parsing has failed.
   * @template BaseShape The shape that parses the input.
   * @template FallbackValue The fallback value.
   */
  constructor(
    /**
     * The shape that parses the input.
     */
    readonly shape: BaseShape,
    /**
     * The value or a callback that returns a value that is returned if parsing has failed.
     *
     *  A callback receives an input value, an array of raised issues, and {@link ApplyOptions parsing options}.
     */
    readonly fallback: FallbackValue | ((input: any, issues: Issue[], options: Readonly<ApplyOptions>) => FallbackValue)
  ) {
    super();

    if (typeof fallback === 'function') {
      this._resultProvider = (input, issues, options) => ok((fallback as Function)(input, issues, options));
    } else {
      const result = ok(fallback);
      this._resultProvider = () => result;
    }
  }

  deepPartial(): CatchShape<DeepPartialShape<BaseShape>, FallbackValue> {
    return copyUnsafeChecks(this, new CatchShape(toDeepPartialShape(this.shape), this.fallback));
  }

  protected _isAsync(): boolean {
    return this.shape.isAsync;
  }

  protected _getInputs(): unknown[] {
    return this.shape.inputs.slice(0);
  }

  protected _apply(input: unknown, options: ApplyOptions, nonce: number): Result<BaseShape[OUTPUT] | FallbackValue> {
    return this._handleResult(this.shape['_apply'](input, options, nonce), input, options);
  }

  protected _applyAsync(input: unknown, options: ApplyOptions, nonce: number): Promise<Result<BaseShape[OUTPUT] | FallbackValue>> {
    return this.shape['_applyAsync'](input, options, nonce).then(result => this._handleResult(result, input, options));
  }

  private _handleResult(
    result: Result,
    input: unknown,
    options: ApplyOptions
  ): Result<BaseShape[OUTPUT] | FallbackValue> {
    const { _applyChecks } = this;

    let issues;
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

    if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
      return result;
    }
    return issues;
  }
}

/**
 * Checks that the input doesn't match the shape.
 *
 * @template BaseShape The base shape.
 * @template ExcludedShape The shape to which the output must not conform.
 */
export class ExcludeShape<BaseShape extends AnyShape, ExcludedShape extends AnyShape>
  extends Shape<BaseShape[INPUT], Exclude<BaseShape[OUTPUT], ExcludedShape[INPUT]>>
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
   * @param shape The shape that parses the input.
   * @param excludedShape The shape to which the output must not conform.
   * @param options The constraint options or an issue message.
   * @template BaseShape The base shape.
   * @template ExcludedShape The shape to which the output must not conform.
   */
  constructor(
    /**
     * The base shape.
     */
    readonly shape: BaseShape,
    /**
     * The shape to which the output must not conform.
     */
    readonly excludedShape: ExcludedShape,
    options?: ConstraintOptions | Message
  ) {
    super();

    this._options = options;
    this._typeIssueFactory = createIssueFactory(CODE_EXCLUDED, MESSAGE_EXCLUDED, options, excludedShape);
  }

  deepPartial(): ExcludeShape<DeepPartialShape<BaseShape>, ExcludedShape> {
    return copyUnsafeChecks(this, new ExcludeShape(toDeepPartialShape(this.shape), this.excludedShape, this._options));
  }

  protected _isAsync(): boolean {
    return this.shape.isAsync || this.excludedShape.isAsync;
  }

  protected _getInputs(): unknown[] {
    return this.shape.inputs.filter(input => isType(input) || !this.excludedShape.inputs.includes(input));
  }

  protected _apply(input: unknown, options: ApplyOptions, nonce: number): Result<Exclude<BaseShape[OUTPUT], ExcludedShape[INPUT]>> {
    const { shape, excludedShape, _applyChecks } = this;

    let issues;
    let output = input;

    let result = shape['_apply'](input, options, nonce);

    if (result !== null) {
      if (isArray(result)) {
        return result;
      }
      output = result.value;
    }

    if (!isArray(excludedShape['_apply'](output, options, nonce))) {
      return this._typeIssueFactory(input, options);
    }

    if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
      return result;
    }
    return issues;
  }

  protected _applyAsync(
    input: unknown,
    options: ApplyOptions,
    nonce: number
  ): Promise<Result<Exclude<BaseShape[OUTPUT], ExcludedShape[INPUT]>>> {
    const { shape, excludedShape, _applyChecks } = this;

    return shape['_applyAsync'](input, options, nonce).then(result => {
      let output = input;

      if (result !== null) {
        if (isArray(result)) {
          return result;
        }
        output = result.value;
      }

      return applyShape(excludedShape, output, options, nonce, outputResult => {
        let issues;

        if (!isArray(outputResult)) {
          return this._typeIssueFactory(input, options);
        }

        if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
          return result;
        }
        return issues;
      });
    });
  }
}
